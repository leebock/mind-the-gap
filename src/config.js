/**
 * Configuration for Census ACS (American Community Survey) services and field mappings
 */
export const CENSUS_CONFIG = {
  "ACS Population and Housing Basics": {
    tract: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/2',
      fields: {
        name: 'NAME',
        county: 'County',
        state: 'State',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E',
        medianIncome: 'B19049_001E'
      }
    },
    state: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Highlights_Population_Housing_Basics_Boundaries/FeatureServer/0',
      fields: {
        name: 'NAME',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E',
        medianIncome: 'B19049_001E'
      }
    }
  },
  "ACS Housing Costs": {
    /*
    tract: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Housing_Costs_Boundaries/FeatureServer/2',
      fields: {
        name: 'NAME',
        state: 'State',
        county: 'County',
        medianContractRent: 'B25058_001E',
        medianHomeValue: 'B25077_001E'
      }
    },*/
    state: {
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Housing_Costs_Boundaries/FeatureServer/0',
      fields: {
        name: 'NAME',
        pctRentersSpendingMoreThan30Pct: 'B25070_calc_pctGE30pctE',
        pctOwnersSpendingMoreThan30Pct: 'B25091_calc_pctNoMortGE30pctE'
      }
    }
  }
};