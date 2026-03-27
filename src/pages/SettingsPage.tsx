import { getAuth, signOut } from 'firebase/auth';

export default function SettingsPage() {
  const handleLogout = async () => {
    await signOut(getAuth());
    localStorage.removeItem('rcrt_token');
    localStorage.removeItem('rcrt_tenant_id');
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6 pb-20 md:pb-4">
        <div className="rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Account</h3>
          <p className="text-xs text-muted-foreground mt-1">Manage your account and sign out.</p>
          <button
            onClick={handleLogout}
            className="mt-4 text-sm text-destructive hover:underline"
          >
            Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">About</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Built with RCRT — AI-native backend infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
