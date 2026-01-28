'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  User,
  MapPin,
  Calendar,
  Clock,
  Copy,
  CheckCircle,
  AlertTriangle,
  Database,
  FileText,
} from 'lucide-react';

// ============================================
// REF CODE DECODER
// ============================================

const REGION_NAMES: { [key: string]: string } = {
  // Canada
  QC: 'Quebec',
  ON: 'Ontario',
  BC: 'British Columbia',
  AB: 'Alberta',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland',
  PE: 'Prince Edward Island',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  // US
  NE: 'Northeast US',
  SE: 'Southeast US',
  MW: 'Midwest US',
  SW: 'Southwest US',
  WE: 'West US',
  AK: 'Alaska',
  HI: 'Hawaii',
  // Other
  EU: 'Europe',
  NA: 'North America (Other)',
  AF: 'Africa',
  SA: 'South America',
};

interface DecodedRef {
  isValid: boolean;
  regionCode: string | null;
  regionName: string | null;
  userSuffix: string | null;
  exportMonth: number | null;
  exportDay: number | null;
  sessionCount: number | null;
  error?: string;
}

function decodeRefCode(refCode: string): DecodedRef {
  // Clean input
  const clean = refCode.replace(/^Ref\s*#?\s*/i, '').trim().toUpperCase();
  
  // Pattern: XX-YYYY-MMDD-NN
  const pattern = /^([A-Z]{2})-([A-F0-9]{4})-(\d{4})-(\d{2})$/;
  const match = clean.match(pattern);
  
  if (!match) {
    return {
      isValid: false,
      regionCode: null,
      regionName: null,
      userSuffix: null,
      exportMonth: null,
      exportDay: null,
      sessionCount: null,
      error: 'Invalid format. Expected: XX-YYYY-MMDD-NN (e.g., QC-A3F8-0106-03)',
    };
  }
  
  const [, regionCode, userSuffix, dateStr, sessionsStr] = match;
  const exportMonth = parseInt(dateStr.slice(0, 2), 10);
  const exportDay = parseInt(dateStr.slice(2, 4), 10);
  const sessionCount = parseInt(sessionsStr, 10);
  
  // Validate month
  if (exportMonth < 1 || exportMonth > 12) {
    return {
      isValid: false,
      regionCode,
      regionName: REGION_NAMES[regionCode] || 'Unknown',
      userSuffix: userSuffix.toLowerCase(),
      exportMonth: null,
      exportDay: null,
      sessionCount,
      error: `Invalid month: ${exportMonth}`,
    };
  }
  
  // Validate day
  if (exportDay < 1 || exportDay > 31) {
    return {
      isValid: false,
      regionCode,
      regionName: REGION_NAMES[regionCode] || 'Unknown',
      userSuffix: userSuffix.toLowerCase(),
      exportMonth,
      exportDay: null,
      sessionCount,
      error: `Invalid day: ${exportDay}`,
    };
  }
  
  return {
    isValid: true,
    regionCode,
    regionName: REGION_NAMES[regionCode] || 'Unknown Region',
    userSuffix: userSuffix.toLowerCase(),
    exportMonth,
    exportDay,
    sessionCount,
  };
}

function generateSearchSQL(decoded: DecodedRef): string {
  if (!decoded.isValid || !decoded.userSuffix) return '';
  
  const currentYear = new Date().getFullYear();
  const dateStr = `${currentYear}-${String(decoded.exportMonth).padStart(2, '0')}-${String(decoded.exportDay).padStart(2, '0')}`;
  
  return `-- Step 1: Find user by ID suffix
SELECT id, email, full_name, created_at
FROM core_profiles
WHERE id::text LIKE '%${decoded.userSuffix}';

-- Step 2: Verify with entries (should have ${decoded.sessionCount} sessions)
SELECT * FROM app_timekeeper_entries
WHERE user_id = '<USER_ID_FROM_STEP_1>'
AND DATE(entry_at) = '${dateStr}'
ORDER BY entry_at;

-- Quick count verification
SELECT COUNT(*) as session_count
FROM app_timekeeper_entries
WHERE user_id = '<USER_ID_FROM_STEP_1>'
AND DATE(entry_at) = '${dateStr}';`;
}

export default function SupportPage() {
  const [refInput, setRefInput] = useState('');
  const [decoded, setDecoded] = useState<DecodedRef | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDecode = () => {
    if (!refInput.trim()) return;
    const result = decodeRefCode(refInput);
    setDecoded(result);
    setCopied(false);
  };

  const handleCopySQL = () => {
    if (!decoded) return;
    const sql = generateSearchSQL(decoded);
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDecode();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header 
        title="Support Tools" 
        description="Decode Ref # codes and lookup users"
      />

      <div className="flex-1 p-6 space-y-6 max-w-4xl">
        {/* Decoder Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ref # Decoder
            </CardTitle>
            <CardDescription>
              Enter a reference code from a PDF report to find the user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., QC-A3F8-0106-03 or Ref # QC-A3F8-0106-03"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-mono"
              />
              <Button onClick={handleDecode}>
                <Search className="h-4 w-4 mr-2" />
                Decode
              </Button>
            </div>

            {/* Format Help */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg font-mono">
              <p className="font-semibold mb-2">Format: XX-YYYY-MMDD-NN</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span>XX = Region code</span>
                <span>YYYY = User ID suffix</span>
                <span>MMDD = Export date</span>
                <span>NN = Session count</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {decoded && (
          <Card className={decoded.isValid ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                {decoded.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                {decoded.isValid ? 'Decoded Successfully' : 'Invalid Code'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {decoded.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{decoded.error}</AlertDescription>
                </Alert>
              )}

              {decoded.isValid && (
                <>
                  {/* Decoded Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <MapPin className="h-3 w-3" />
                        Region
                      </div>
                      <p className="font-semibold">{decoded.regionName}</p>
                      <Badge variant="outline" className="mt-1">{decoded.regionCode}</Badge>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <User className="h-3 w-3" />
                        User Suffix
                      </div>
                      <p className="font-mono font-semibold text-lg">{decoded.userSuffix}</p>
                      <p className="text-xs text-muted-foreground">Last 4 chars of ID</p>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Calendar className="h-3 w-3" />
                        Export Date
                      </div>
                      <p className="font-semibold">
                        {String(decoded.exportMonth).padStart(2, '0')}/{String(decoded.exportDay).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-muted-foreground">Month/Day</p>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Clock className="h-3 w-3" />
                        Sessions
                      </div>
                      <p className="font-semibold text-lg">{decoded.sessionCount}</p>
                      <p className="text-xs text-muted-foreground">In report</p>
                    </div>
                  </div>

                  {/* SQL Query */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Database className="h-4 w-4" />
                        SQL Query (Supabase)
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopySQL}>
                        {copied ? (
                          <><CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Copied!</>
                        ) : (
                          <><Copy className="h-4 w-4 mr-1" /> Copy SQL</>
                        )}
                      </Button>
                    </div>
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
                      {generateSearchSQL(decoded)}
                    </pre>
                  </div>

                  {/* Instructions */}
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>How to use:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                        <li>Copy the SQL above</li>
                        <li>Go to Supabase → SQL Editor</li>
                        <li>Run Step 1 to find the user</li>
                        <li>Replace {'<USER_ID_FROM_STEP_1>'} with the actual ID</li>
                        <li>Run Step 2 to see their sessions</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Region Reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Region Codes Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(REGION_NAMES).map(([code, name]) => (
                <div key={code} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono w-10 justify-center">{code}</Badge>
                  <span className="text-muted-foreground truncate">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
