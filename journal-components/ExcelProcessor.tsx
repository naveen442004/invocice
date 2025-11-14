import React, { useState, useCallback, useEffect } from 'react';
import type { RawRow, FileState, Status, VoucherType, LedgerEntry, Stats, AppConfigs, LedgerAccount, NameMappingResult } from '../journal-types';
import { getExcelSheetNames, parseExcelFile, exportToExcel } from '../journal-services/excelService';
import { convertDataToLedger } from '../journal-services/conversionService';
import { autoMapSalesPurchase, autoMapJournal, autoMapBankStatement, matchAndSuggestLedgers } from '../journal-services/geminiService';
import { FileUpload } from './FileUpload';
import { ConfigPanel } from './ConfigPanel';
import { PreviewPanel } from './PreviewPanel';
import { SuggestionsPanel } from './SuggestionsPanel';
import { DEFAULT_CONFIGS, getFieldsForVoucherType } from '../constants';

const VOUCHER_TYPES: { id: VoucherType; label: string }[] = [
    { id: 'Sales', label: 'Sales Vouchers' },
    { id: 'Purchase', label: 'Purchase Vouchers' },
    { id: 'Journal', label: 'Journal Vouchers' },
    { id: 'Bank Statement', label: 'Bank Statement' },
];

interface ExcelProcessorProps {
    showStatus: (message: string, type: Status['type']) => void;
    chartOfAccounts: LedgerAccount[];
}

export const ExcelProcessor: React.FC<ExcelProcessorProps> = ({ showStatus, chartOfAccounts }) => {
  const [fileState, setFileState] = useState<FileState>({ file: null, rawData: [], headers: [] });
  const [correctedRawData, setCorrectedRawData] = useState<RawRow[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [activeVoucherType, setActiveVoucherType] = useState<VoucherType>('Sales');
  const [configs, setConfigs] = useState<AppConfigs>(DEFAULT_CONFIGS);
  const [convertedData, setConvertedData] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [nameMappingResult, setNameMappingResult] = useState<NameMappingResult | null>(null);

  const resetState = useCallback(() => {
    setFileState({ file: null, rawData: [], headers: [] });
    setCorrectedRawData([]);
    setSheetNames([]);
    setSelectedSheet('');
    setConfigs(DEFAULT_CONFIGS);
    setConvertedData([]);
    setStats(null);
    setNameMappingResult(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);
  
  const handleConfigChange = (newConfig: AppConfigs[VoucherType]) => {
    setConfigs(prev => ({ ...prev, [activeVoucherType]: newConfig }));
  };
  
  const parseSheetData = useCallback(async (file: File, sheetName: string) => {
      setIsProcessing(true);
      setConvertedData([]);
      setStats(null);
      setNameMappingResult(null);
      // Don't reset configs here to allow voucher type to persist
      
      try {
          const { rawData, headers } = await parseExcelFile(file, sheetName);
          setFileState(prev => ({ ...prev, rawData, headers }));
          if (rawData.length === 0) {
              showStatus(`Sheet "${sheetName}" appears to be empty or has no data.`, 'info');
          }
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          showStatus(`Error reading sheet "${sheetName}": ${errorMessage}`, 'error');
          setFileState(prev => ({...prev, rawData: [], headers: []}));
      } finally {
          setIsProcessing(false);
      }
  }, [showStatus]);

  const handleFileSelect = useCallback(async (file: File) => {
    resetState();
    setIsProcessing(true);
    try {
      const sheets = await getExcelSheetNames(file);
      if (sheets.length === 0) {
          showStatus('Could not find any sheets in the Excel file.', 'error');
          setIsProcessing(false);
          return;
      }
      setFileState({ file, rawData: [], headers: [] });
      setSheetNames(sheets);
      setSelectedSheet(sheets[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showStatus(`Error reading file: ${errorMessage}`, 'error');
      resetState();
      setIsProcessing(false);
    }
  }, [resetState, showStatus]);

  useEffect(() => {
    if (fileState.file && selectedSheet) {
        parseSheetData(fileState.file, selectedSheet);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSheet, fileState.file]);

  const handleAutoMap = useCallback(async () => {
    if (fileState.headers.length === 0) return showStatus('Please upload a file and select a sheet first.', 'error');
    
    setIsAiMapping(true);
    try {
      const fields = getFieldsForVoucherType(activeVoucherType);
      let suggestedConfig;

      if (activeVoucherType === 'Sales' || activeVoucherType === 'Purchase') {
        suggestedConfig = await autoMapSalesPurchase(fileState.headers, fields);
      } else if (activeVoucherType === 'Journal') {
        suggestedConfig = await autoMapJournal(fileState.headers, fields);
      } else if (activeVoucherType === 'Bank Statement') {
        suggestedConfig = await autoMapBankStatement(fileState.headers, fields);
      }
      
      setConfigs(prev => ({
        ...prev,
        [activeVoucherType]: { ...prev[activeVoucherType], ...suggestedConfig }
      }));
      
      showStatus('AI mapping complete. Please review the results.', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showStatus(`AI mapping failed: ${errorMessage}`, 'error');
    } finally {
      setIsAiMapping(false);
    }
  }, [fileState.headers, activeVoucherType, showStatus]);

  // New Effect: Automatically trigger AI mapping when a sheet is loaded or voucher type changes.
  useEffect(() => {
    if (fileState.headers.length > 0 && !isProcessing) {
        handleAutoMap();
    }
  // handleAutoMap is memoized with its own dependencies, including activeVoucherType
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileState.headers, activeVoucherType]);


  // Effect for AI Name Matching and creating the corrected dataset
  useEffect(() => {
    const partyNameColumn = (configs[activeVoucherType] as any).partyName as string | undefined;

    const runMatching = async () => {
      try {
        const uniquePartyNames: string[] = Array.from(new Set(fileState.rawData.map(row => String(row[partyNameColumn!] || '')).filter(name => name.trim() !== '')));
        
        if (uniquePartyNames.length === 0) {
            setCorrectedRawData(fileState.rawData);
            setNameMappingResult(null);
            return;
        }

        const result = await matchAndSuggestLedgers(uniquePartyNames, chartOfAccounts, activeVoucherType);
        setNameMappingResult(result);

        const corrections = result.corrections || {};
        if (Object.keys(corrections).length === 0) {
            setCorrectedRawData(fileState.rawData);
            return;
        }

        const newData = fileState.rawData.map(row => {
            const originalName = String(row[partyNameColumn!] || '');
            if (corrections[originalName]) {
                return { ...row, [partyNameColumn!]: corrections[originalName] };
            }
            return row;
        });
        setCorrectedRawData(newData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatus(`AI name matching failed: ${errorMessage}`, 'error');
        setCorrectedRawData(fileState.rawData);
        setNameMappingResult(null);
      }
    };

    if (chartOfAccounts.length > 0 && fileState.rawData.length > 0 && partyNameColumn) {
      runMatching();
    } else {
      setCorrectedRawData(fileState.rawData);
      setNameMappingResult(null);
    }
  }, [fileState.rawData, chartOfAccounts, activeVoucherType, configs, showStatus]);


  // Effect for converting data into the final ledger format for preview
  useEffect(() => {
    if (correctedRawData.length === 0) {
      setConvertedData([]);
      setStats(null);
      return;
    }
    
    try {
      const { entries, stats } = convertDataToLedger(
        correctedRawData,
        activeVoucherType,
        configs[activeVoucherType],
        {} // Corrections are already applied, so pass an empty map
      );
      setConvertedData(entries);
      setStats(stats);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatus(`Error processing data: ${errorMessage}`, 'error');
        setConvertedData([]);
        setStats(null);
    }
  }, [correctedRawData, activeVoucherType, configs, showStatus]);

  const handleDownload = useCallback(() => {
    if (convertedData.length === 0) return showStatus('No data available to download.', 'error');
    
    try {
      exportToExcel(convertedData, `Converted_${activeVoucherType.replace(' ', '_')}_Ledger.xlsx`);
      showStatus('Excel file downloaded successfully!', 'success');
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
       showStatus(`Failed to download Excel file: ${errorMessage}`, 'error');
    }
  }, [convertedData, activeVoucherType, showStatus]);
  
  const showConfigPanel = fileState.file !== null;
  const showPreviewPanel = convertedData.length > 0;

  return (
    <div className="space-y-6">
        <FileUpload onFileSelect={handleFileSelect} onFileClear={resetState} file={fileState.file} isProcessing={isProcessing} />
        
        {showConfigPanel && (
           <div className="bg-surface rounded-lg border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-text">Step 2: Configure Your Conversion</h2>
                <p className="text-sm text-text-secondary mt-1">Select the sheet and voucher type, then map the columns.</p>
                
                {sheetNames.length > 1 && (
                  <div className="mt-4">
                    <label htmlFor="sheet-selector" className="block text-sm font-medium text-text-secondary mb-1">Select a sheet to process</label>
                    <select
                      id="sheet-selector"
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="w-full max-w-sm bg-surface border border-border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                      disabled={isProcessing}
                    >
                      {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {VOUCHER_TYPES.map(v => (
                      <button key={v.id} onClick={() => setActiveVoucherType(v.id)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeVoucherType === v.id
                              ? 'bg-primary text-white shadow'
                              : 'bg-surface hover:bg-background text-text border border-border'
                      }`}>
                          {v.label}
                      </button>
                  ))}
                </div>
              </div>
              
              <ConfigPanel
                headers={fileState.headers}
                voucherType={activeVoucherType}
                config={configs[activeVoucherType]}
                onConfigChange={handleConfigChange}
                onAutoMap={handleAutoMap}
                isAiMapping={isAiMapping}
              />
           </div>
        )}
        
        {nameMappingResult && <SuggestionsPanel result={nameMappingResult} />}

        {showPreviewPanel && stats && (
          <PreviewPanel entries={convertedData} stats={stats} onDownload={handleDownload} onReset={resetState} />
        )}
    </div>
  );
};