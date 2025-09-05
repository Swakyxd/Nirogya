const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock disease database - you can replace this with actual data from your chatbot
const diseases = [
  {
    name: 'Cholera',
    type: 'waterborne',
    symptoms: ['severe diarrhea', 'vomiting', 'dehydration', 'muscle cramps'],
    prevention: ['drink safe water', 'proper sanitation', 'wash hands frequently'],
    treatment: 'oral rehydration therapy, antibiotics in severe cases',
    incubationPeriod: '2 hours to 5 days',
    severity: 'high'
  },
  {
    name: 'Typhoid',
    type: 'waterborne',
    symptoms: ['high fever', 'headache', 'stomach pain', 'rose-colored rash'],
    prevention: ['vaccination', 'safe water', 'proper food handling'],
    treatment: 'antibiotics, supportive care',
    incubationPeriod: '6-30 days',
    severity: 'high'
  },
  {
    name: 'Hepatitis A',
    type: 'waterborne',
    symptoms: ['fatigue', 'nausea', 'jaundice', 'stomach pain'],
    prevention: ['vaccination', 'safe water', 'good hygiene'],
    treatment: 'supportive care, rest',
    incubationPeriod: '15-50 days',
    severity: 'medium'
  },
  {
    name: 'Diarrhea',
    type: 'waterborne',
    symptoms: ['loose stools', 'stomach cramps', 'dehydration'],
    prevention: ['safe water', 'proper sanitation', 'hand hygiene'],
    treatment: 'oral rehydration, probiotics',
    incubationPeriod: '1-3 days',
    severity: 'low-medium'
  }
];

// Get all diseases
router.get('/', auth, async (req, res) => {
  try {
    const { type, severity } = req.query;
    
    let filteredDiseases = diseases;
    
    if (type) {
      filteredDiseases = filteredDiseases.filter(disease => 
        disease.type === type
      );
    }
    
    if (severity) {
      filteredDiseases = filteredDiseases.filter(disease => 
        disease.severity.includes(severity)
      );
    }
    
    res.json({
      diseases: filteredDiseases,
      total: filteredDiseases.length
    });
  } catch (error) {
    console.error('Get diseases error:', error);
    res.status(500).json({ message: 'Error fetching disease information' });
  }
});

// Get specific disease information
router.get('/:name', auth, async (req, res) => {
  try {
    const diseaseName = req.params.name.toLowerCase();
    
    const disease = diseases.find(d => 
      d.name.toLowerCase() === diseaseName
    );
    
    if (!disease) {
      return res.status(404).json({ message: 'Disease information not found' });
    }
    
    res.json(disease);
  } catch (error) {
    console.error('Get disease error:', error);
    res.status(500).json({ message: 'Error fetching disease information' });
  }
});

// Search diseases by symptoms
router.post('/search-by-symptoms', auth, async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ message: 'Symptoms array is required' });
    }
    
    const matchingDiseases = diseases.filter(disease => {
      const diseaseSymptoms = disease.symptoms.map(s => s.toLowerCase());
      const inputSymptoms = symptoms.map(s => s.toLowerCase());
      
      // Check if any input symptoms match disease symptoms
      return inputSymptoms.some(symptom => 
        diseaseSymptoms.some(ds => ds.includes(symptom) || symptom.includes(ds))
      );
    }).map(disease => {
      // Calculate match score
      const diseaseSymptoms = disease.symptoms.map(s => s.toLowerCase());
      const inputSymptoms = symptoms.map(s => s.toLowerCase());
      
      const matches = inputSymptoms.filter(symptom => 
        diseaseSymptoms.some(ds => ds.includes(symptom) || symptom.includes(ds))
      );
      
      return {
        ...disease,
        matchScore: (matches.length / Math.max(inputSymptoms.length, diseaseSymptoms.length)) * 100,
        matchingSymptoms: matches
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
    
    res.json({
      possibleDiseases: matchingDiseases,
      disclaimer: 'This is for informational purposes only. Please consult a healthcare professional for proper diagnosis.',
      searchedSymptoms: symptoms
    });
  } catch (error) {
    console.error('Symptom search error:', error);
    res.status(500).json({ message: 'Error searching diseases by symptoms' });
  }
});

// Get prevention guidelines
router.get('/prevention/guidelines', auth, async (req, res) => {
  try {
    const guidelines = {
      waterSafety: [
        'Boil water for at least 1 minute before drinking',
        'Use water purification tablets if boiling is not possible',
        'Store treated water in clean, covered containers',
        'Avoid ice unless made from safe water'
      ],
      foodSafety: [
        'Cook food thoroughly and eat while hot',
        'Avoid raw or undercooked food',
        'Wash fruits and vegetables with safe water',
        'Avoid street food from unreliable sources'
      ],
      hygiene: [
        'Wash hands frequently with soap and safe water',
        'Use alcohol-based hand sanitizer when soap is unavailable',
        'Keep fingernails short and clean',
        'Avoid touching face with unwashed hands'
      ],
      sanitation: [
        'Use proper toilet facilities',
        'Dispose of waste properly',
        'Keep living areas clean',
        'Ensure proper drainage around homes'
      ],
      community: [
        'Report unusual disease patterns to health workers',
        'Participate in community health programs',
        'Support water source protection initiatives',
        'Educate family and neighbors about prevention'
      ]
    };
    
    res.json({
      guidelines,
      lastUpdated: new Date(),
      source: 'Nirogya Health Monitoring System'
    });
  } catch (error) {
    console.error('Guidelines error:', error);
    res.status(500).json({ message: 'Error fetching prevention guidelines' });
  }
});

module.exports = router;
