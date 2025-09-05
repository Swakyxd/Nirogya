import os
import warnings
from dotenv import load_dotenv

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning)

class MedicalAssistant:
    def __init__(self):
        """Initialize the medical assistant"""
        self.embeddings = None
        self.llm = None
        self.vector_store = None
        self.rag_chain = None
        self.supported_languages = {
            'english': 'en',
            'hindi': 'hi', 
            'assamese': 'as',
            'bengali': 'bn',
            'manipuri': 'mni'
        }
        
    def detect_language(self, text):
        """Simple language detection based on script and common words"""
        text_lower = text.lower()
        
        # Bengali/Assamese detection (Devanagari-like script)
        if any(char in text for char in 'অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ'):
            if any(word in text_lower for word in ['আমি', 'আমার', 'করা', 'হয়', 'আছে']):
                return 'bengali'
            else:
                return 'assamese'
        
        # Hindi detection (Devanagari script)
        elif any(char in text for char in 'अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह'):
            return 'hindi'
            
        # Default to English
        return 'english'
    
    def get_language_templates(self, language):
        """Get response templates for different languages"""
        templates = {
            'english': {
                'disease': "🔍 **DISEASE IDENTIFIED**",
                'symptoms': "📋 **SYMPTOM ANALYSIS**",
                'description': "🦠 **WHAT IS THIS DISEASE**",
                'causes': "🌊 **WHY IT HAPPENS (Causes)**",
                'precautions': "⚠️ **IMMEDIATE PRECAUTIONS**",
                'prevention': "🛡️ **PREVENTION MEASURES**",
                'medical_help': "🏥 **WHEN TO SEEK MEDICAL HELP**",
                'local_context': "📍 **NORTHEAST INDIA CONTEXT**",
                'disclaimer': "⚠️ **MEDICAL DISCLAIMER**: This is for educational purposes only. Please consult a qualified doctor immediately for proper diagnosis and treatment."
            },
            'hindi': {
                'disease': "🔍 **पहचानी गई बीमारी**",
                'symptoms': "📋 **लक्षण विश्लेषण**",
                'description': "🦠 **यह बीमारी क्या है**",
                'causes': "🌊 **यह क्यों होता है (कारण)**",
                'precautions': "⚠️ **तत्काल सावधानियां**",
                'prevention': "🛡️ **बचाव के उपाय**",
                'medical_help': "🏥 **डॉक्टर से कब मिलें**",
                'local_context': "📍 **पूर्वोत्तर भारत संदर्भ**",
                'disclaimer': "⚠️ **चिकित्सा अस्वीकरण**: यह केवल शैक्षणिक उद्देश्यों के लिए है। कृपया उचित निदान और उपचार के लिए तुरंत योग्य डॉक्टर से सलाह लें।"
            },
            'bengali': {
                'disease': "🔍 **চিহ্নিত রোগ**",
                'symptoms': "📋 **লক্ষণ বিশ্লেষণ**",
                'description': "🦠 **এই রোগ কি**",
                'causes': "🌊 **কেন এটি হয় (কারণসমূহ)**",
                'precautions': "⚠️ **অবিলম্বে সতর্কতা**",
                'prevention': "🛡️ **প্রতিরোধের ব্যবস্থা**",
                'medical_help': "🏥 **কখন ডাক্তার দেখাবেন**",
                'local_context': "📍 **উত্তর-পূর্ব ভারত প্রসঙ্গ**",
                'disclaimer': "⚠️ **চিকিৎসা দাবিত্যাগ**: এটি শুধুমাত্র শিক্ষামূলক উদ্দেশ্যে। সঠিক নির্ণয় ও চিকিৎসার জন্য অবিলম্বে যোগ্য ডাক্তারের পরামর্শ নিন।"
            },
            'assamese': {
                'disease': "🔍 **চিনাক্ত কৰা ৰোগ**",
                'symptoms': "📋 **লক্ষণ বিশ্লেষণ**",
                'description': "🦠 **এই ৰোগ কি**",
                'causes': "🌊 **কিয় এনে হয় (কাৰণসমূহ)**",
                'precautions': "⚠️ **তৎক্ষণাৎ সাৱধানতা**",
                'prevention': "🛡️ **প্ৰতিৰোধৰ ব্যৱস্থা**",
                'medical_help': "🏥 **কেতিয়া চিকিৎসক দেখুৱাব**",
                'local_context': "📍 **উত্তৰ-পূব ভাৰত প্ৰসংগ**",
                'disclaimer': "⚠️ **চিকিৎসা দাবী ত্যাগ**: এইটো কেৱল শিক্ষামূলক উদ্দেশ্যৰ বাবে। সঠিক নিদান আৰু চিকিৎসাৰ বাবে অবিলম্বে যোগ্য চিকিৎসকৰ পৰামৰ্শ লওক।"
            }
        }
        return templates.get(language, templates['english'])
    
    def create_vector_store(self, data_path, vector_store_path="faiss_index"):
        """Create and save a FAISS vector store from documents"""
        if os.path.exists(vector_store_path):
            print("📂 Loading existing vector store...")
            return FAISS.load_local(vector_store_path, self.embeddings, allow_dangerous_deserialization=True)

        print("🔄 Creating new vector store...")
        loader = TextLoader(data_path, encoding='utf-8')
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=300)
        docs = text_splitter.split_documents(documents)

        vector_store = FAISS.from_documents(docs, self.embeddings)
        vector_store.save_local(vector_store_path)
        print("✅ Vector store created and saved.")
        return vector_store

    def create_rag_chain(self, user_language='english'):
        """Create a RAG chain with language-specific prompt"""
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        templates = self.get_language_templates(user_language)
        
        # Create language-specific prompt
        prompt_template = f"""
        You are a medical assistant specialized in water-borne diseases common in Northeast India.
        The user has described symptoms in {user_language}. Respond in the SAME language ({user_language}).
        
        **IMPORTANT**: Provide your response in the following structured format in {user_language}:

        {templates['disease']}: [Disease Name in {user_language}]

        {templates['symptoms']}:
        - [Match user's described symptoms with the disease in {user_language}]
        - [Explain how the symptoms align in {user_language}]

        {templates['description']}:
        [Brief explanation of the disease in {user_language}]

        {templates['causes']}:
        [Main causes, especially water-related sources common in Northeast India in {user_language}]

        {templates['precautions']}:
        [What to do right now in {user_language}]

        {templates['prevention']}:
        [Long-term prevention strategies in {user_language}]

        {templates['medical_help']}:
        [Warning signs that require immediate medical attention in {user_language}]

        {templates['local_context']}:
        [Specific information about this disease in Northeast Indian states in {user_language}]

        {templates['disclaimer']}

        Context from medical database:
        {{context}}

        User's symptoms: {{input}}

        Respond in {user_language}:
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_template)
        
        rag_chain = (
            {"context": retriever, "input": RunnablePassthrough()}
            | create_stuff_documents_chain(self.llm, prompt)
        )
        return rag_chain

    def process_multilingual_input(self, user_input):
        """Process and normalize user input"""
        symptom_translations = {
            # Hindi to English
            'bukhar': 'fever', 'sir dard': 'headache', 'pet dard': 'stomach pain',
            'ulti': 'vomiting', 'kamzori': 'weakness', 'loose motion': 'diarrhea',
            
            # Assamese terms
            'jor': 'fever', 'matha byatha': 'headache', 'pet byatha': 'stomach pain',
            'boroni': 'vomiting', 'pet cholova': 'loose motion',
            
            # Bengali terms  
            'jvoor': 'fever', 'matha betha': 'headache', 'pete betha': 'stomach pain'
        }
        
        processed_input = user_input.lower()
        for local_term, english_term in symptom_translations.items():
            processed_input = processed_input.replace(local_term, english_term)
        
        return processed_input

    def initialize(self):
        """Initialize the medical assistant with API key and models"""
        load_dotenv()
        groq_api_key = os.getenv("GROQ_API_KEY")

        if not groq_api_key:
            print("❌ Error: GROQ_API_KEY not found. Please set it in the .env file.")
            return False

        # Initialize models
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.llm = ChatGroq(temperature=0.1, groq_api_key=groq_api_key, model_name="llama-3.1-8b-instant")
        
        # Create vector store
        self.vector_store = self.create_vector_store("disease.txt")
        
        return True

    def chat_interface(self):
        """Clean terminal chat interface"""
        print("\n" + "="*60)
        print("🏥 NORTHEAST INDIA MEDICAL ASSISTANT")
        print("="*60)
        print("📍 Coverage: All 8 Northeast States")
        print("🌐 Languages: English • Hindi • অসমীয়া • বাংলা")
        print("💊 Focus: Water-borne diseases")
        print("⚠️  Educational guidance only - Always consult a doctor!")
        print("\nType 'exit' to quit")
        print("-"*60)

        while True:
            print()
            user_input = input("🔸 Describe your symptoms: ")
            
            if user_input.lower().strip() in ["exit", "quit", "bye"]:
                print("\n💙 Stay healthy! Consult a doctor for any health concerns.")
                break

            if not user_input.strip():
                print("⚠️ Please describe your symptoms.")
                continue

            try:
                # Detect language and create appropriate chain
                detected_language = self.detect_language(user_input)
                print(f"🌐 Detected language: {detected_language.title()}")
                
                # Create RAG chain for detected language
                self.rag_chain = self.create_rag_chain(detected_language)
                
                print("🔄 Analyzing symptoms...")
                
                # Process input and get response
                processed_input = self.process_multilingual_input(user_input)
                response = self.rag_chain.invoke(processed_input)
                
                print("\n" + "="*60)
                print("📋 ANALYSIS REPORT")
                print("="*60)
                print(response)
                print("="*60)
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                print("🔄 Please try again or check your connection.")

def main():
    """Main function to run the medical assistant"""
    assistant = MedicalAssistant()
    
    if assistant.initialize():
        assistant.chat_interface()
    else:
        print("Failed to initialize. Please check your configuration.")

if __name__ == "__main__":
    main()