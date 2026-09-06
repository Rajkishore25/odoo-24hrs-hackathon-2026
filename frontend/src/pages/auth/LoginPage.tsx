import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sun, Moon, Loader2 } from 'lucide-react';
import { getApiError } from '@/api/client';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { label: 'Payroll Officer', email: 'payroll@peoplepay360.com' },
    { label: 'HR Manager', email: 'hr@peoplepay360.com' },
    { label: 'Employee', email: 'rahul@peoplepay360.com' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card border-r border-border p-12">
        <div>
          <span className="text-2xl font-bold text-foreground">
            People<span className="text-primary">Pay</span>360
          </span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Trustworthy payroll<br />starts with correct data.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Connected HR-to-payroll platform that validates workforce data,
            prevents critical errors from being finalized, and explains every payslip amount.
          </p>
          <div className="space-y-3">
            {[
              'Payroll Validation Cockpit',
              'Explainable Payslips',
              'Contract Period Intelligence',
              'Complete Audit Trail',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">PeoplePay360 — Hackathon MVP 2026</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center mb-2">
            <span className="text-xl font-bold">
              People<span className="text-primary">Pay</span>360
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Enter your credentials to access the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-critical border border-critical/30 bg-critical-muted rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo account quick-fill */}
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">Demo accounts (password: Password123!)</p>
            <div className="flex flex-col gap-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword('Password123!'); }}
                  className="text-xs text-left px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
                >
                  <span className="font-medium text-foreground">{acc.label}</span>
                  {' — '}{acc.email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
