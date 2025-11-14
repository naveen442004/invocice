
import React, { useState, useCallback, useEffect } from 'react';
// FIX: Import 'RawRow' to resolve 'Cannot find name' error.
import type { Status, LedgerAccount, FileState, VoucherType, AppConfigs, LedgerEntry, Stats, NameMappingResult, RawRow } from '../journal-types';
import { extractDataFromDocument, matchAndSuggestLedgers, autoMapSalesPurchase, autoMapJournal, autoMapBankStatement } from '../journal-services/geminiService';
import { exportToExcel } from '../journal-services/excelService';
import { convertDataToLedger } from '../journal-services/conversionService';
import { PDF_PROCESSING_TIPS } from '../constants';
import { SuggestionsPanel } from './SuggestionsPanel';
import { ConfigPanel } from './ConfigPanel';
import { PreviewPanel } from './PreviewPanel';
import { DEFAULT_CONFIGS, getFieldsForVoucherType } from '../constants';

interface PdfProcessorProps {
    showStatus: (message: string, type: Status['type']) => void;
    chartOfAccounts: LedgerAccount[];
    documentTypeForced: 'Bank Statement' | 'Sales Invoice' | 'Purchase Invoice' | 'Journal';
}

export const PdfProcessor: React.FC<PdfProcessorProps> = ({ showStatus, chartOfAccounts, documentTypeForced }) => {
    // This state is now very similar to ExcelProcessor
    const [fileState, setFileState] = useState<FileState>({ file: null, rawData: [], headers: [] });
    const [correctedRawData, setCorrectedRawData] = useState<RawRow[]>([]);
    const [activeVoucherType, setActiveVoucherType] = useState<VoucherType>('Sales');
    const [configs, setConfigs] = useState<AppConfigs>(DEFAULT_CONFIGS);
    const [convertedData, setConvertedData] = useState<LedgerEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAiMapping, setIsAiMapping] = useState(false);
    const [nameMappingResult, setNameMappingResult] = useState<NameMappingResult | null>(null);
    const [tip, setTip] = useState('');

    // Map the forced document type to the VoucherType for the config panel
    useEffect(() => {
        const mapping = {
            'Sales Invoice': 'Sales',
            'Purchase Invoice': 'Purchase',
            'Bank Statement': 'Bank Statement',
            'Journal': 'Journal',
        };
        setActiveVoucherType(mapping[documentTypeForced] as VoucherType);
    }, [documentTypeForced]);

    const resetState = useCallback(() => {
        setFileState({ file: null, rawData: [], headers: [] });
        setCorrectedRawData([]);
        setConfigs(DEFAULT_CONFIGS);
        setConvertedData([]);
        setStats(null);
        setNameMappingResult(null);
        setIsProcessing(false);
        const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, []);

    useEffect(() => {
        resetState();
    }, [documentTypeForced, resetState]);


    // Tip cycler effect
    useEffect(() => {
        let interval: number;
        if (isProcessing) {
            interval = window.setInterval(() => {
                setTip(PDF_PROCESSING_TIPS[Math.floor(Math.random() * PDF_PROCESSING_TIPS.length)]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isProcessing]);


    const handleFileSelect = useCallback(async (file: File) => {
        resetState();
        setFileState(prev => ({ ...prev, file }));
        setIsProcessing(true);
        setTip(PDF_PROCESSING_TIPS[0]);

        try {
            const { rawData, headers } = await extractDataFromDocument(file, activeVoucherType);
            if (rawData.length === 0) {
                 showStatus(`AI could not find any data in this ${documentTypeForced}. Please try another file.`, 'error');
                 setIsProcessing(false);
                 return;
            }
            setFileState({ file, rawData, headers });
            showStatus('Extraction complete. Please verify the mapping.', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            showStatus(`Error processing file: ${errorMessage}`, 'error');
            resetState();
        } finally {
            setIsProcessing(false);
        }
    }, [resetState, activeVoucherType, showStatus, documentTypeForced]);
    
    // Auto-mapping logic, identical to ExcelProcessor
    const handleAutoMap = useCallback(async () => {
        if (fileState.headers.length === 0) return showStatus('Please upload and process a file first.', 'error');
        
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

    // Effect to trigger auto-mapping once data is extracted from PDF
    useEffect(() => {
        if (fileState.headers.length > 0 && !isProcessing) {
            handleAutoMap();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileState.headers]);

    // Effect for AI Name Matching
    useEffect(() => {
        const partyNameColumn = (configs[activeVoucherType] as any).partyName as string | undefined;

        const runMatching = async () => {
            try {
                // FIX: Explicitly type 'uniquePartyNames' as string[] to prevent type inference issues.
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


    // Effect for converting data
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
                {} // Corrections already applied
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
        exportToExcel(convertedData, `Converted_${activeVoucherType.replace(' ', '_')}.xlsx`);
        showStatus('Excel file downloaded successfully!', 'success');
    }, [convertedData, activeVoucherType, showStatus]);

    const showConfig = fileState.rawData.length > 0;
    const showPreview = convertedData.length > 0;

    return (
        <div className="space-y-6">
            <div className="bg-surface rounded-lg border border-border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-text mb-4">Upload {documentTypeForced}</h2>
                {fileState.file && !isProcessing ? (
                    <div className="flex items-center justify-between bg-background p-3 rounded-md border border-border">
                        <div className="flex items-center gap-3">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="font-medium text-sm">{fileState.file.name}</span>
                        </div>
                         <button
                            onClick={resetState}
                            className="text-text-secondary hover:text-error transition-colors p-1 rounded-full"
                            title="Remove file"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                    </div>
                ) : (
                    <div
                        onClick={() => !isProcessing && document.getElementById('pdf-file-input')?.click()}
                        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md transition-colors duration-200 ${isProcessing ? 'cursor-wait bg-background' : 'cursor-pointer border-border hover:border-primary'}`}
                    >
                        <input
                            id="pdf-file-input"
                            type="file"
                            className="hidden"
                            accept=".pdf, .png, .jpg, .jpeg"
                            onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileSelect(e.target.files[0])}
                            disabled={isProcessing}
                        />
                        <div className="text-center">
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <p className="mt-2 text-sm font-medium text-text">Analyzing Document...</p>
                                    <p className="mt-1 text-xs text-text-secondary h-4">{tip}</p>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <p className="mt-2 text-sm font-medium text-text">
                                      <span className="text-primary">Click to upload</span> a document
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">PDF, PNG, or JPG files</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showConfig && (
                <div className="bg-surface rounded-lg border border-border shadow-sm">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-lg font-semibold text-text">Configure Your Conversion</h2>
                        <p className="text-sm text-text-secondary mt-1">AI has extracted the data. Now map the columns for conversion.</p>
                    </div>
                    <ConfigPanel
                        headers={fileState.headers}
                        voucherType={activeVoucherType}
                        config={configs[activeVoucherType]}
                        onConfigChange={(newConfig) => setConfigs(prev => ({...prev, [activeVoucherType]: newConfig}))}
                        onAutoMap={handleAutoMap}
                        isAiMapping={isAiMapping}
                    />
                </div>
            )}
            
            {nameMappingResult && <SuggestionsPanel result={nameMappingResult} />}

            {showPreview && stats && (
                <PreviewPanel entries={convertedData} stats={stats} onDownload={handleDownload} onReset={resetState} />
            )}
        </div>
    );
};
