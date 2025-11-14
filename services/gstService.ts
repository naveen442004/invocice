import { PartyDetails, indianStates, IndianStateCode } from '../types';

/**
 * Extracts state details from a GSTIN offline.
 * @param gstin The 15-character GSTIN.
 * @returns A partial PartyDetails object with state and country.
 * @throws Error if GSTIN format or state code is invalid.
 */
export const getDetailsFromGstin = (gstin: string): Partial<PartyDetails> => {
    if (!gstin || gstin.length !== 15) {
        throw new Error("Invalid GSTIN format. Must be 15 characters.");
    }

    const stateCode = gstin.substring(0, 2) as IndianStateCode;
    const stateName = indianStates[stateCode];

    if (!stateName) {
        throw new Error("Invalid state code in GSTIN.");
    }

    return {
        state: stateName,
        country: 'India',
    };
};
