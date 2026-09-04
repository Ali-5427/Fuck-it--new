import { insforge } from './insforge';
import { User } from '../types';
import { store } from './store';
import { ADMIN_EMAILS } from '../config/admin';

export type Unsubscribe = () => void;

export class AuthService {
  private currentUser: User | null = null;
  private unsubscribeAuth: Unsubscribe | null = null;
  private inFlightSyncPromise: Promise<User | null> | null = null;

  constructor() {
    this.initAuthListener();
  }

  private async fetchAndSyncUserProfile(insUser: any): Promise<User> {
    const { data: rawProfileData } = await insforge.auth.getProfile(insUser.id);
    const profileData: any = rawProfileData || {};

    let userTier = (profileData?.tier as any) || 'pro';
    const trialEndsAt = profileData?.trialEndsAt as string | undefined;

    const profileUpdatesToPersist: Record<string, any> = {};

    if (trialEndsAt && userTier === 'pro') {
      if (Date.now() > new Date(trialEndsAt).getTime()) {
        userTier = 'free';
        profileUpdatesToPersist.tier = 'free';
      }
    }

    const emailLower = (insUser.email || '').toLowerCase();
    const isWhitelistedAdmin = ADMIN_EMAILS.includes(emailLower);
    const userRole = isWhitelistedAdmin ? 'admin' : (profileData?.role || 'developer');

    // Auto-promote role to admin in DB if user is whitelisted but not yet admin in DB
    if (isWhitelistedAdmin && profileData?.role !== 'admin') {
      profileUpdatesToPersist.role = 'admin';
    }

    // Ensure appleTeamId and apiKey are generated once and persisted if missing
    let appleTeamId = (profileData?.appleTeamId as string | undefined)?.trim();
    if (!appleTeamId) {
      appleTeamId = 'APL' + Math.random().toString(36).substring(2, 8).toUpperCase();
      profileUpdatesToPersist.appleTeamId = appleTeamId;
    }

    const apiKey = (profileData?.apiKey as string | undefined)?.trim();

    if (Object.keys(profileUpdatesToPersist).length > 0) {
      await insforge.auth.setProfile(profileUpdatesToPersist).catch(err => {
        console.warn('Could not persist profile updates during sync:', err);
      });
    }

    const appUser: User = {
      id: insUser.id,
      email: insUser.email || emailLower || 'developer@apple.dev',
      name: profileData?.name || insUser.profile?.name || (insUser.email ? insUser.email.split('@')[0] : 'iOS Developer'),
      role: userRole,
      tier: userTier,
      trialEndsAt,
      teamName: (profileData?.teamName as string) || 'Apple Developer Team',
      appleTeamId,
      avatarUrl: profileData?.avatar_url || insUser.profile?.avatar_url || undefined,
      createdAt: insUser.createdAt || new Date().toISOString(),
      settings: {
        notificationsEnabled: profileData?.notificationsEnabled ?? true,
        autoRecheckOnUpload: profileData?.autoRecheckOnUpload ?? true,
        defaultExportFormat: profileData?.defaultExportFormat ?? 'markdown',
        apiKey
      }
    };

    return appUser;
  }

  private async syncCurrentUser(knownUser?: any): Promise<User | null> {
    if (this.inFlightSyncPromise) {
      return this.inFlightSyncPromise;
    }

    this.inFlightSyncPromise = (async () => {
      try {
        let insUser = knownUser;
        if (!insUser) {
          const { data: userData } = await insforge.auth.getCurrentUser();
          insUser = userData?.user;
        }
        if (insUser) {
          const appUser = await this.fetchAndSyncUserProfile(insUser);
          this.currentUser = appUser;
          store.setUser(appUser);
          return appUser;
        }
        return null;
      } catch (err) {
        console.warn('Error syncing user profile and auth state:', err);
        return null;
      } finally {
        this.inFlightSyncPromise = null;
      }
    })();

    return this.inFlightSyncPromise;
  }

  private initAuthListener() {
    // Subscribe to InsForge auth changes
    const unsubscribe = insforge.auth.onAuthStateChange(async (event) => {
      if (event === 'signedIn' || event === 'tokenRefreshed') {
        await this.syncCurrentUser();
      } else if (event === 'signedOut') {
        this.currentUser = null;
        store.setUser(null);
      }
    });

    this.unsubscribeAuth = () => unsubscribe();

    // Initial check on load
    this.syncCurrentUser().catch(err => {
      console.warn('Error checking initial auth state:', err);
    });
  }

  // Google OAuth Sign-in
  public async signInWithGoogle(): Promise<User | null> {
    const { data, error } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: window.location.origin,
    });
    if (error) throw error;

    // A redirect-based OAuth flow can resolve after the browser is redirected and the
    // auth state listener finishes login. If the sync returns null here, that's OK.
    const syncedUser = await this.syncCurrentUser();
    return syncedUser || this.currentUser || null;
  }

  // Email & Password Registration
  public async registerWithEmail(
    email: string, 
    pass: string, 
    name: string, 
    tier: 'free' | 'pro' | 'studio' = 'pro',
    appleTeamId?: string,
    teamName?: string
  ): Promise<User | 'needs_verification'> {
    const { data: regData, error: regError } = await insforge.auth.signUp({
      email,
      password: pass,
      name,
    });
    if (regError) throw regError;
    const insUser = regData?.user;
    if (!insUser) throw new Error('Registration failed.');

    // InsForge requires email verification — signal the UI to show OTP input
    if (regData?.requireEmailVerification) {
      return 'needs_verification';
    }

    const trialEndsAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const isWhitelistedAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const userRole = isWhitelistedAdmin ? 'admin' : 'developer';

    const finalAppleTeamId = appleTeamId?.trim() || 'DEV' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const appUser: User = {
      id: insUser.id,
      email: insUser.email || email,
      name: name || email.split('@')[0],
      role: userRole,
      tier: 'pro',
      trialEndsAt,
      teamName: teamName || 'Indie Studio',
      appleTeamId: finalAppleTeamId,
      createdAt: new Date().toISOString(),
      settings: {
        notificationsEnabled: true,
        autoRecheckOnUpload: true,
        defaultExportFormat: 'markdown'
      }
    };

    const { error: profileError } = await insforge.auth.setProfile({
      name: appUser.name,
      role: appUser.role,
      tier: appUser.tier,
      trialEndsAt: appUser.trialEndsAt,
      teamName: appUser.teamName,
      appleTeamId: appUser.appleTeamId,
      notificationsEnabled: appUser.settings?.notificationsEnabled ?? true,
      autoRecheckOnUpload: appUser.settings?.autoRecheckOnUpload ?? true,
      defaultExportFormat: appUser.settings?.defaultExportFormat ?? 'markdown',
    });
    if (profileError) throw profileError;

    this.currentUser = appUser;
    store.setUser(appUser);
    return appUser;
  }

  // Verify email with OTP code (called after registration when requireEmailVerification=true)
  public async verifyEmailOtp(email: string, otp: string): Promise<User> {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) throw error;
    const insUser = data?.user;
    if (!insUser) throw new Error('Verification failed.');
    const appUser = await this.fetchAndSyncUserProfile(insUser);
    this.currentUser = appUser;
    store.setUser(appUser);
    return appUser;
  }

  // Email & Password Login
  public async loginWithEmail(email: string, pass: string): Promise<User> {
    const { data: logData, error: logError } = await insforge.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (logError) throw logError;
    const insUser = logData?.user;
    if (!insUser) throw new Error('User not found.');

    const appUser = await this.fetchAndSyncUserProfile(insUser);
    this.currentUser = appUser;
    store.setUser(appUser);
    return appUser;
  }

  // Password Reset Email
  public async sendPasswordReset(email: string): Promise<void> {
    const { error } = await insforge.auth.sendResetPasswordEmail({
      email,
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  }

  // Complete Password Reset with OTP / Token
  public async resetPasswordWithOtp(newPassword: string, otp: string): Promise<void> {
    const { error } = await insforge.auth.resetPassword({
      newPassword,
      otp,
    });
    if (error) throw error;
  }

  // Sign Out
  public async signOut(): Promise<void> {
    try {
      const { error } = await insforge.auth.signOut();
      if (error) console.warn('InsForge signOut notice:', error);
    } catch (err) {
      console.warn('Sign out caught error:', err);
    } finally {
      this.currentUser = null;
      store.setUser(null);
    }
  }

  // Sync profile updates to InsForge
  public async updateUserProfile(updates: Partial<User>): Promise<void> {
    if (!this.currentUser) return;
    
    const profileUpdate: Record<string, any> = {};
    if (updates.name) profileUpdate.name = updates.name;
    if (updates.tier) profileUpdate.tier = updates.tier;
    if (updates.teamName) profileUpdate.teamName = updates.teamName;
    if (updates.appleTeamId) profileUpdate.appleTeamId = updates.appleTeamId;
    if (updates.avatarUrl) profileUpdate.avatar_url = updates.avatarUrl;
    if (updates.settings) {
      if (updates.settings.notificationsEnabled !== undefined) profileUpdate.notificationsEnabled = updates.settings.notificationsEnabled;
      if (updates.settings.autoRecheckOnUpload !== undefined) profileUpdate.autoRecheckOnUpload = updates.settings.autoRecheckOnUpload;
      if (updates.settings.defaultExportFormat !== undefined) profileUpdate.defaultExportFormat = updates.settings.defaultExportFormat;
      if (updates.settings.apiKey !== undefined) profileUpdate.apiKey = updates.settings.apiKey;
    }

    const { error } = await insforge.auth.setProfile(profileUpdate);
    if (error) throw error;

    this.currentUser = {
      ...this.currentUser,
      ...updates,
      settings: {
        ...(this.currentUser.settings || {}),
        ...(updates.settings || {})
      }
    };
    store.setUser(this.currentUser);
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();
