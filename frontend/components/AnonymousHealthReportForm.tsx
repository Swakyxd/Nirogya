'use client'

import React, { useState } from 'react'

interface HealthReportData {
  patientInfo: {
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
    phoneNumber?: string
  }
  symptoms: Array<{
    name: string
    severity: 'mild' | 'moderate' | 'severe'
    duration: string
  }>
  location: {
    state: string
    district: string
    village?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  waterSource?: {
    type: 'well' | 'borehole' | 'river' | 'pond' | 'piped' | 'other'
    quality: 'good' | 'poor' | 'contaminated' | 'unknown'
  }
  urgency: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
}

export const AnonymousHealthReportForm = () => {
  const [formData, setFormData] = useState<HealthReportData>({
    patientInfo: {
      name: '',
      age: 0,
      gender: 'male'
    },
    symptoms: [{ name: '', severity: 'mild', duration: '' }],
    location: {
      state: '',
      district: ''
    },
    urgency: 'medium'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Submit without authentication
      const response = await fetch('/api/reports/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setSubmitStatus('success')
        // Reset form or redirect
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add form fields here...
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
        
        <input
          type="text"
          placeholder="Patient Name"
          value={formData.patientInfo.name}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            patientInfo: { ...prev.patientInfo, name: e.target.value }
          }))}
          className="w-full p-3 border rounded-md mb-3"
          required
        />
        
        <input
          type="number"
          placeholder="Age"
          value={formData.patientInfo.age || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            patientInfo: { ...prev.patientInfo, age: parseInt(e.target.value) }
          }))}
          className="w-full p-3 border rounded-md mb-3"
          required
        />
        
        <select
          value={formData.patientInfo.gender}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            patientInfo: { ...prev.patientInfo, gender: e.target.value as 'male' | 'female' | 'other' }
          }))}
          className="w-full p-3 border rounded-md"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Location */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Location</h3>
        
        <select
          value={formData.location.state}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            location: { ...prev.location, state: e.target.value }
          }))}
          className="w-full p-3 border rounded-md mb-3"
          required
        >
          <option value="">Select State</option>
          <option value="Assam">Assam</option>
          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
          <option value="Manipur">Manipur</option>
          <option value="Meghalaya">Meghalaya</option>
          <option value="Mizoram">Mizoram</option>
          <option value="Nagaland">Nagaland</option>
          <option value="Tripura">Tripura</option>
          <option value="Sikkim">Sikkim</option>
        </select>
        
        <input
          type="text"
          placeholder="District"
          value={formData.location.district}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            location: { ...prev.location, district: e.target.value }
          }))}
          className="w-full p-3 border rounded-md mb-3"
          required
        />
        
        <input
          type="text"
          placeholder="Village (Optional)"
          value={formData.location.village || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            location: { ...prev.location, village: e.target.value }
          }))}
          className="w-full p-3 border rounded-md"
        />
      </div>

      {/* Symptoms */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Symptoms</h3>
        
        {formData.symptoms.map((symptom, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Symptom (e.g., fever, diarrhea)"
              value={symptom.name}
              onChange={(e) => {
                const newSymptoms = [...formData.symptoms]
                newSymptoms[index].name = e.target.value
                setFormData(prev => ({ ...prev, symptoms: newSymptoms }))
              }}
              className="p-3 border rounded-md"
              required
            />
            
            <select
              value={symptom.severity}
              onChange={(e) => {
                const newSymptoms = [...formData.symptoms]
                newSymptoms[index].severity = e.target.value as 'mild' | 'moderate' | 'severe'
                setFormData(prev => ({ ...prev, symptoms: newSymptoms }))
              }}
              className="p-3 border rounded-md"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            
            <input
              type="text"
              placeholder="Duration (e.g., 2 days)"
              value={symptom.duration}
              onChange={(e) => {
                const newSymptoms = [...formData.symptoms]
                newSymptoms[index].duration = e.target.value
                setFormData(prev => ({ ...prev, symptoms: newSymptoms }))
              }}
              className="p-3 border rounded-md"
            />
          </div>
        ))}
        
        <button
          type="button"
          onClick={() => setFormData(prev => ({
            ...prev,
            symptoms: [...prev.symptoms, { name: '', severity: 'mild', duration: '' }]
          }))}
          className="text-blue-600 hover:text-blue-800"
        >
          + Add Another Symptom
        </button>
      </div>

      {/* Urgency */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Urgency Level</h3>
        
        <select
          value={formData.urgency}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            urgency: e.target.value as 'low' | 'medium' | 'high' | 'critical'
          }))}
          className="w-full p-3 border rounded-md"
        >
          <option value="low">Low - Can wait for regular appointment</option>
          <option value="medium">Medium - Needs attention within days</option>
          <option value="high">High - Needs attention within hours</option>
          <option value="critical">Critical - Emergency situation</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Health Report'}
      </button>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Report submitted successfully! Health authorities have been notified.
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error submitting report. Please try again or contact local health workers.
        </div>
      )}
    </form>
  )
}
