import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { salaryApi } from '@/api/salary';
import { SalaryStructure, SalaryRule } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from '@/hooks/useToast';
import { getApiError } from '@/api/client';
import { cn } from '@/lib/utils';

const categoryVariant: Record<string, 'success' | 'critical' | 'info'> = {
  EARNING: 'success', DEDUCTION: 'critical', NET: 'info',
};

export function SalaryPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState<{ structureId: string } | null>(null);

  // Structure form
  const [structName, setStructName] = useState('');
  const [structDesc, setStructDesc] = useState('');

  // Rule form
  const [ruleName, setRuleName] = useState('');
  const [ruleCode, setRuleCode] = useState('');
  const [ruleCategory, setRuleCategory] = useState('EARNING');
  const [ruleSeq, setRuleSeq] = useState('');
  const [ruleCalcType, setRuleCalcType] = useState('FIXED');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleDependsOn, setRuleDependsOn] = useState('');
  const [ruleFormula, setRuleFormula] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salaryApi.listStructures();
      setStructures(res.data.data);
    } catch (err) {
      toast.error('Failed to load salary structures', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createStructure() {
    if (!structName) return;
    setSubmitting(true);
    try {
      await salaryApi.createStructure({ name: structName, description: structDesc });
      toast.success('Salary structure created');
      setShowStructureForm(false);
      setStructName(''); setStructDesc('');
      load();
    } catch (err) {
      toast.error('Failed to create structure', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function createRule() {
    if (!showRuleForm || !ruleName || !ruleCode || !ruleSeq) return;
    setSubmitting(true);
    try {
      await salaryApi.createRule({
        structureId: showRuleForm.structureId,
        name: ruleName, code: ruleCode,
        category: ruleCategory,
        sequence: parseInt(ruleSeq),
        calculationType: ruleCalcType,
        value: ruleValue ? parseFloat(ruleValue) : null,
        dependsOnCode: ruleDependsOn || null,
        formulaDescription: ruleFormula || undefined,
      });
      toast.success('Salary rule added');
      setShowRuleForm(null);
      setRuleName(''); setRuleCode(''); setRuleSeq(''); setRuleValue('');
      setRuleDependsOn(''); setRuleFormula('');
      load();
    } catch (err) {
      toast.error('Failed to create rule', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Salary Structures"
        description="Configure salary rules used in payroll computation"
        actions={
          <Button onClick={() => setShowStructureForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Structure
          </Button>
        }
      />

      {loading ? <LoadingState /> : structures.length === 0 ? (
        <EmptyState icon={DollarSign} title="No salary structures" description="Create a salary structure with rules to enable payroll computation." />
      ) : (
        <div className="space-y-4">
          {structures.map((structure) => (
            <Card key={structure.id}>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 text-left"
                    onClick={() => setExpanded(expanded === structure.id ? null : structure.id)}
                  >
                    {expanded === structure.id
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <div>
                      <CardTitle className="text-sm">{structure.name}</CardTitle>
                      {structure.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{structure.description}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{structure.rules?.length ?? 0} rules</span>
                    <Button size="sm" variant="outline" onClick={() => setShowRuleForm({ structureId: structure.id })}>
                      <Plus className="mr-1 h-3 w-3" /> Add Rule
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expanded === structure.id && (
                <CardContent className="pt-4">
                  {!structure.rules || structure.rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No rules yet. Add rules to define the salary calculation.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {['Seq', 'Code', 'Name', 'Category', 'Calculation', 'Value / Basis'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {structure.rules.sort((a, b) => a.sequence - b.sequence).map((rule) => (
                          <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                            <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{rule.sequence}</td>
                            <td className="px-3 py-2 font-mono text-xs font-semibold">{rule.code}</td>
                            <td className="px-3 py-2 font-medium">{rule.name}</td>
                            <td className="px-3 py-2">
                              <Badge variant={categoryVariant[rule.category] ?? 'default'} className="text-xs">
                                {rule.category}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">{rule.calculationType}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {rule.formulaDescription ?? (
                                rule.calculationType === 'FIXED' ? `₹${rule.value}` :
                                rule.calculationType === 'PERCENTAGE' ? `${rule.value}% of ${rule.dependsOnCode ?? 'BASIC'}` :
                                rule.dependsOnCode ?? '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Structure */}
      <Dialog open={showStructureForm} onOpenChange={(o) => !o && setShowStructureForm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Salary Structure</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name <span className="text-critical">*</span></Label>
              <Input value={structName} onChange={(e) => setStructName(e.target.value)} placeholder="Regular Monthly" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={structDesc} onChange={(e) => setStructDesc(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStructureForm(false)}>Cancel</Button>
            <Button onClick={createStructure} disabled={submitting || !structName}>Create Structure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Rule */}
      <Dialog open={!!showRuleForm} onOpenChange={(o) => !o && setShowRuleForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Salary Rule</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rule Code <span className="text-critical">*</span></Label>
              <Input value={ruleCode} onChange={(e) => setRuleCode(e.target.value.toUpperCase())} placeholder="HRA" />
            </div>
            <div className="space-y-1.5">
              <Label>Name <span className="text-critical">*</span></Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="House Rent Allowance" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={ruleCategory} onValueChange={setRuleCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EARNING">EARNING</SelectItem>
                  <SelectItem value="DEDUCTION">DEDUCTION</SelectItem>
                  <SelectItem value="NET">NET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sequence <span className="text-critical">*</span></Label>
              <Input type="number" value={ruleSeq} onChange={(e) => setRuleSeq(e.target.value)} placeholder="20" />
            </div>
            <div className="space-y-1.5">
              <Label>Calculation Type</Label>
              <Select value={ruleCalcType} onValueChange={setRuleCalcType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">FIXED</SelectItem>
                  <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                  <SelectItem value="REFERENCE">REFERENCE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value {ruleCalcType === 'PERCENTAGE' ? '(%)' : ruleCalcType === 'FIXED' ? '(₹)' : ''}</Label>
              <Input type="number" value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder="20" />
            </div>
            <div className="space-y-1.5">
              <Label>Depends On Code</Label>
              <Input value={ruleDependsOn} onChange={(e) => setRuleDependsOn(e.target.value.toUpperCase())} placeholder="BASIC" />
            </div>
            <div className="space-y-1.5">
              <Label>Formula Description</Label>
              <Input value={ruleFormula} onChange={(e) => setRuleFormula(e.target.value)} placeholder="BASIC × 20%" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleForm(null)}>Cancel</Button>
            <Button onClick={createRule} disabled={submitting || !ruleName || !ruleCode || !ruleSeq}>Add Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
