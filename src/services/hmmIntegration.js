// HMM Integration Service - Connects to Go backend for lead quality scoring

class HMMIntegrationService {
  constructor() {
    this.baseURL = process.env.GO_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.GO_API_KEY;
  }
  
  async predictLeadQuality(leadData) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/hmm/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          contact: leadData.contactInfo,
          preferences: leadData.propertyPreferences,
          source: leadData.leadSource,
        }),
      });
      
      if (!response.ok) {
        console.error('HMM prediction failed:', await response.text());
        return this.getDefaultPrediction();
      }
      
      const data = await response.json();
      return {
        qualityScore: data.conversionProbability * 100,
        state: data.state, // 'cold', 'warm', 'hot', 'burning'
        probability: data.conversionProbability,
        recommendedPrice: data.recommendedPrice || leadData.price,
      };
    } catch (error) {
      console.error('HMM integration error:', error);
      return this.getDefaultPrediction();
    }
  }
  
  getDefaultPrediction() {
    return {
      qualityScore: 50,
      state: 'warm',
      probability: 0.50,
      recommendedPrice: null,
    };
  }
}

module.exports = new HMMIntegrationService();
