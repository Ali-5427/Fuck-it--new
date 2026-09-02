export type PlistValue =
  | string
  | number
  | boolean
  | null
  | PlistValue[]
  | { [key: string]: PlistValue };

export function isPlistDict(value: PlistValue | undefined): value is { [key: string]: PlistValue } {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parsePlistBytes(buffer: ArrayBuffer): PlistValue {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 8) {
    const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]);
    if (magic === 'bplist00') {
      return parseBinaryPlist(buffer);
    }
  }
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
  if (!text.includes('<plist') && !text.includes('<dict')) {
    throw new Error('This file is not a readable Info.plist (XML or binary). Export Info.plist as XML from Xcode, or upload an IPA/ZIP.');
  }
  return parseXmlPlist(text);
}

export function parseXmlPlist(xml: string): PlistValue {
  if (typeof DOMParser === 'undefined') {
    throw new Error('Plist XML parsing is not available in this environment.');
  }
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Info.plist XML could not be parsed. Paste the XML export from Xcode.');
  }
  const plist = doc.querySelector('plist');
  const root = plist?.firstElementChild;
  if (!root) {
    throw new Error('Info.plist is empty.');
  }
  return parseXmlNode(root);
}

function parseXmlNode(node: Element): PlistValue {
  switch (node.tagName) {
    case 'dict': {
      const obj: { [key: string]: PlistValue } = {};
      const children = Array.from(node.children);
      for (let i = 0; i < children.length; i++) {
        if (children[i].tagName !== 'key') continue;
        const key = children[i].textContent || '';
        const valueNode = children[i + 1];
        if (valueNode) {
          obj[key] = parseXmlNode(valueNode);
          i++;
        }
      }
      return obj;
    }
    case 'array':
      return Array.from(node.children).map(parseXmlNode);
    case 'string':
      return node.textContent || '';
    case 'integer':
      return parseInt(node.textContent || '0', 10);
    case 'real':
      return parseFloat(node.textContent || '0');
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return node.textContent || '';
  }
}

function parseBinaryPlist(buffer: ArrayBuffer): PlistValue {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (buffer.byteLength < 40) {
    throw new Error('Binary Info.plist is truncated.');
  }

  const trailer = buffer.byteLength - 32;
  const offsetIntSize = view.getUint8(trailer + 6);
  const objectRefSize = view.getUint8(trailer + 7);
  const numObjects = Number(view.getBigUint64(trailer + 8));
  const topObject = Number(view.getBigUint64(trailer + 16));
  const offsetTableOffset = Number(view.getBigUint64(trailer + 24));

  const readSizedInt = (offset: number, size: number): number => {
    let n = 0;
    for (let i = 0; i < size; i++) {
      n = (n * 256) + bytes[offset + i];
    }
    return n;
  };

  const offsets: number[] = [];
  for (let i = 0; i < numObjects; i++) {
    offsets.push(readSizedInt(offsetTableOffset + i * offsetIntSize, offsetIntSize));
  }

  const cache = new Map<number, PlistValue>();

  const parseObject = (index: number): PlistValue => {
    if (cache.has(index)) return cache.get(index) as PlistValue;
    const offset = offsets[index];
    if (offset === undefined) return null;

    const marker = bytes[offset];
    const type = marker & 0xf0;
    let size = marker & 0x0f;
    let headerSize = 1;

    if (size === 0x0f && type !== 0x00) {
      const sizeMarker = bytes[offset + 1];
      const intSize = 1 << (sizeMarker & 0x0f);
      size = readSizedInt(offset + 2, intSize);
      headerSize = 2 + intSize;
    }

    let value: PlistValue = null;

    if (type === 0x00) {
      if (marker === 0x08) value = false;
      else if (marker === 0x09) value = true;
      else value = null;
    } else if (type === 0x10) {
      const intBytes = 1 << size;
      if (intBytes === 8) {
        value = Number(view.getBigInt64(offset + headerSize));
      } else {
        value = readSizedInt(offset + headerSize, intBytes);
      }
    } else if (type === 0x50) {
      value = new TextDecoder('latin1').decode(bytes.slice(offset + headerSize, offset + headerSize + size));
    } else if (type === 0x60) {
      const slice = bytes.slice(offset + headerSize, offset + headerSize + size * 2);
      let text = '';
      for (let i = 0; i < size; i++) {
        text += String.fromCharCode((slice[i * 2] << 8) | slice[i * 2 + 1]);
      }
      value = text;
    } else if (type === 0x40) {
      value = `[data ${size} bytes]`;
    } else if (type === 0xa0 || type === 0xc0) {
      const arr: PlistValue[] = [];
      cache.set(index, arr);
      for (let i = 0; i < size; i++) {
        const ref = readSizedInt(offset + headerSize + i * objectRefSize, objectRefSize);
        arr.push(parseObject(ref));
      }
      return arr;
    } else if (type === 0xd0) {
      const dict: { [key: string]: PlistValue } = {};
      cache.set(index, dict);
      const keyStart = offset + headerSize;
      const valStart = keyStart + size * objectRefSize;
      for (let i = 0; i < size; i++) {
        const keyRef = readSizedInt(keyStart + i * objectRefSize, objectRefSize);
        const valRef = readSizedInt(valStart + i * objectRefSize, objectRefSize);
        dict[String(parseObject(keyRef))] = parseObject(valRef);
      }
      return dict;
    }

    cache.set(index, value);
    return value;
  };

  return parseObject(topObject);
}

export function plistString(dict: { [key: string]: PlistValue }, key: string): string {
  const value = dict[key];
  return typeof value === 'string' ? value : value != null && typeof value !== 'object' ? String(value) : '';
}

export function plistBool(dict: { [key: string]: PlistValue }, key: string): boolean | undefined {
  const value = dict[key];
  if (typeof value === 'boolean') return value;
  return undefined;
}

export function flattenPlistStrings(value: PlistValue, acc: string[] = []): string[] {
  if (typeof value === 'string') acc.push(value);
  else if (Array.isArray(value)) value.forEach(item => flattenPlistStrings(item, acc));
  else if (isPlistDict(value)) Object.values(value).forEach(item => flattenPlistStrings(item, acc));
  return acc;
}
