import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  Key,
  RefreshCw,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function Settings() {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Fetch 2FA status
  const { data: twoFactorStatus, refetch: refetchStatus } = trpc.twoFactor.status.useQuery();

  // Setup 2FA mutation
  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: () => {
      toast.success('2FA setup initiated. Scan the QR code with your authenticator app.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Verify 2FA mutation
  const verifyMutation = trpc.twoFactor.verify.useMutation({
    onSuccess: () => {
      toast.success('2FA has been enabled successfully!');
      setSetupDialogOpen(false);
      setVerificationCode('');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Disable 2FA mutation
  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      toast.success('2FA has been disabled');
      setDisableDialogOpen(false);
      setDisableCode('');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = trpc.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: () => {
      toast.success('New backup codes generated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetup = () => {
    setupMutation.mutate();
    setSetupDialogOpen(true);
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    verifyMutation.mutate({ token: verificationCode });
  };

  const handleDisable = () => {
    if (disableCode.length < 6) {
      toast.error('Please enter a valid code');
      return;
    }
    disableMutation.mutate({
      token: disableCode,
      type: disableCode.length === 6 ? 'totp' : 'backup',
    });
  };

  const handleRegenerate = () => {
    if (regenerateCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    regenerateMutation.mutate({ token: regenerateCode });
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account and security settings</p>
      </div>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Protect your account with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              {twoFactorStatus?.enabled ? (
                <ShieldCheck className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldOff className="h-8 w-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  {twoFactorStatus?.enabled
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security to your account'}
                </p>
                {twoFactorStatus?.verifiedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Enabled on{' '}
                    {new Date(twoFactorStatus.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {twoFactorStatus?.enabled ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setRegenerateDialogOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Backup Codes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDisableDialogOpen(true)}
                  >
                    Disable 2FA
                  </Button>
                </>
              ) : (
                <Button onClick={handleSetup} disabled={setupMutation.isPending}>
                  {setupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup 2FA Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator,
              Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          {setupMutation.data && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={setupMutation.data.qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input
                    value={setupMutation.data.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(setupMutation.data.secret, 'secret')
                    }
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="space-y-2">
                <Label>Backup Codes (save these somewhere safe!):</Label>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {setupMutation.data.backupCodes.map((code, i) => (
                      <span key={i}>{code}</span>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      copyToClipboard(
                        setupMutation.data.backupCodes.join('\n'),
                        'codes'
                      )
                    }
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All Codes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app:</Label>
                <div className="flex gap-2">
                  <Input
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    className="font-mono text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={
                      verificationCode.length !== 6 || verifyMutation.isPending
                    }
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {setupMutation.isPending && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current 2FA code or a backup code to disable 2FA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/[^A-Za-z0-9-]/g, ''))}
                placeholder="6-digit code or backup code"
                className="font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDisableDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disableCode.length < 6 || disableMutation.isPending}
              >
                {disableMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Disable 2FA'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Backup Codes</DialogTitle>
            <DialogDescription>
              This will invalidate your existing backup codes. Enter your current
              2FA code to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!regenerateMutation.data ? (
              <>
                <div className="space-y-2">
                  <Label>Current 2FA Code</Label>
                  <Input
                    value={regenerateCode}
                    onChange={(e) =>
                      setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    className="font-mono text-center"
                    maxLength={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRegenerateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={
                      regenerateCode.length !== 6 || regenerateMutation.isPending
                    }
                  >
                    {regenerateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Generate New Codes'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Your New Backup Codes:</h4>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {regenerateMutation.data.backupCodes.map((code, i) => (
                      <span key={i}>{code}</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-orange-600">
                  Save these codes somewhere safe. They won't be shown again.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    setRegenerateDialogOpen(false);
                    setRegenerateCode('');
                    regenerateMutation.reset();
                  }}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
