import React, { useState, useRef, useEffect } from 'react';
import {
  BotMessageSquare,
  Send,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { info } = useToast();
  const { language, t } = useLanguage();

  const [lifeStage, setLifeStage] = useState<string>('My Health');

  useEffect(() => {
    apiService.getLifeStage().then((res) => {
      if (res.data?.currentMode) {
        setLifeStage(res.data.currentMode);
      }
    });
  }, []);

  const getInitialAssistantGreeting = (stage: string = lifeStage) => {
    const firstName = user?.name?.split(' ')[0] || (language === 'te' ? 'మిత్రమా' : language === 'hi' ? 'साथी' : 'there');
    const stg = stage.toLowerCase();

    if (stg.includes('pregnancy')) {
      switch (language) {
        case 'te':
          return `నమస్కారం ${firstName}! మీ **గర్భధారణ సంరక్షణ AI సహాయకురాలికి** స్వాగతం.\n\nత్రైమాసిక జాగ్రత్తలు, శిశువు కదలికలు (కిక్స్ కౌంట్), పోషకాహారం మరియు ప్రినేటల్ పరీక్షల గురించి నన్ను అడగండి.\n\n*ఈరోజు మీ గర్భధారణ ఆరోగ్యానికి నేను ఎలా సహాయపడగలను?*`;
        case 'hi':
          return `नमस्ते ${firstName}! आपके **गर्भावस्था देखभाल AI सहायक** में स्वागत है।\n\nतिमाही के अनुसार सावधानियां, बच्चे की हलचल, पोषण और चेकअप के बारे में पूछें।\n\n*आज गर्भावस्था स्वास्थ्य में मैं आपकी क्या सहायता करूँ?*`;
        default:
          return `Hello ${firstName}! Welcome to your **SHE Twin Pregnancy Care Assistant**.\n\nI am here to guide you through trimester milestones, fetal movement patterns, nutrition, and antenatal vitals.\n\n*What would you like to know about your pregnancy health today?*`;
      }
    }

    if (stg.includes('postpartum')) {
      switch (language) {
        case 'te':
          return `నమస్కారం ${firstName}! మీ **ప్రసవానంతర సంరక్షణ మరియు రికవరీ గైడ్**.\n\nడెలివరీ తర్వాత కోలుకోవడం, రక్తస్రావం (లోకియా), గాయం పరిశుభ్రత మరియు మానసిక ఆరోగ్యానికి నేను తోడుగా ఉంటాను.\n\n*ఈరోజు మీ రికవరీ ఎలా ఉంది?*`;
        case 'hi':
          return `नमस्ते ${firstName}! आपके **प्रसवोत्तर (डिलीवरी के बाद) रिकवरी गाइड** में स्वागत है।\n\nडिलीवरी के बाद स्वास्थ्य सुधार, टांकों की देखभाल, स्तनपान और मानसिक शांति में आपका सहयोग।\n\n*आज आपकी रिकवरी कैसी चल रही है?*`;
        default:
          return `Hello ${firstName}! Welcome to your **Fourth-Trimester Postpartum Healing Guide**.\n\nI am here to support your maternal recovery, lochia tracking, wound care, and mental wellbeing.\n\n*How are you feeling in your recovery today?*`;
      }
    }

    if (stg.includes('teen') || stg.includes('young women')) {
      switch (language) {
        case 'te':
          return `నమస్కారం ${firstName}! **టీనేజ్ మరియు కౌమార బాలికల ఆరోగ్య విభాగానికి** స్వాగతం.\n\nరుతుచక్రం, పీరియడ్స్ నొప్పి నివారణ, మొటిమలు మరియు నీరసం తగ్గించే ఆహారం గురించి తెలుసుకోండి.\n\n*ఈరోజు మీ ప్రశ్న ఏమిటి?*`;
        case 'hi':
          return `नमस्ते ${firstName}! **किशोरी (टीनएज) स्वास्थ्य मंच** में आपका स्वागत है।\n\nमासिक धर्म चक्र, पीरियड्स के दर्द से राहत, मुहांसों की देखभाल और ऊर्जा बढ़ाने के टिप्स पाएं।\n\n*आज आपका क्या सवाल है?*`;
        default:
          return `Hello ${firstName}! Welcome to your **Adolescent & Young Women's Wellness Space**.\n\nI can help you understand your menstrual cycle, relieve school cramps, navigate hormonal skin changes, and boost daily energy.\n\n*What question do you have today?*`;
      }
    }

    if (stg.includes('menopause')) {
      switch (language) {
        case 'te':
          return `నమస్కారం ${firstName}! **మెనోపాజ్ మరియు హార్మోన్ల మార్పుల సంరక్షణకు** స్వాగతం.\n\nవేడి ఆవిర్లు, రాత్రి చెమటలు, ఎముకల బలం మరియు నిద్ర సమస్యలను ఎదుర్కొనే మార్గదర్శకాలు.\n\n*ఈరోజు మీ ఆరోగ్యంలో నేను ఎలా సహాయపడగలను?*`;
        case 'hi':
          return `नमस्ते ${firstName}! **मेनोपॉज (रजोनिवृत्ति) स्वास्थ्य देखभाल** में आपका स्वागत है।\n\nअचानक तेज गर्मी लगना (Hot Flashes), हड्डियों की मजबूती, नींद और मानसिक शांति के उपाय पाएं।\n\n*आज आपकी क्या सहायता करूँ?*`;
        default:
          return `Hello ${firstName}! Welcome to your **Menopause & Perimenopause Transition Care**.\n\nI can guide you on managing hot flashes, night sweats, bone strength, and mood balance.\n\n*How can I assist your health and vitality today?*`;
      }
    }

    if (stg.includes('reproductive')) {
      switch (language) {
        case 'te':
          return `నమస్కారం ${firstName}! మహిళల రుతుచక్రం, హార్మోన్లు మరియు PCOS సంరక్షణ.\n\nసైకిల్ ట్రాకింగ్, కడుపునొప్పి నివారణ మరియు సంతానోత్పత్తి ఆరోగ్యం గురించి అడగండి.`;
        case 'hi':
          return `नमस्ते ${firstName}! महिला मासिक धर्म, हार्मोन और PCOS मार्गदर्शन।\n\nसाइकिल ट्रैकिंग, पेट दर्द से राहत और हार्मोनल संतुलन के बारे में पूछें।`;
        default:
          return `Hello ${firstName}! Welcome to your **Reproductive Health & Cycle Balance Assistant**.\n\nI can help evaluate cycle regularity, PCOS management, pelvic wellness, and hormonal balance.\n\n*How can I support your reproductive health today?*`;
      }
    }

    if (stg.includes('family')) {
      switch (language) {
        case 'te':
          return `నమస్కారం ${firstName}! కుటుంబ సభ్యుల సంరక్షణ మరియు మద్దతు గైడ్.\n\nమీ కుమార్తె, తల్లి లేదా భార్య ఆరోగ్యం, రికవరీ మరియు డాక్టర్ సలహాల గురించి తెలుసుకోండి.`;
        case 'hi':
          return `नमस्ते ${firstName}! परिवार और देखभालकर्ता (Family Ally) स्वास्थ्य सहायता।\n\nअपने परिवार के सदस्यों की रिकवरी, आवश्यक देखभाल और डॉक्टर की सलाह के बारे में पूछें।`;
        default:
          return `Hello ${firstName}! Welcome to your **Family Ally & Caregiver Support Hub**.\n\nI provide empathetic caregiver checklists, recovery monitoring, and clinic visit guidance for your family.\n\n*Which family member are you assisting today?*`;
      }
    }

    // Default My Health
    switch (language) {
      case 'te':
        return `నమస్కారం ${firstName}! నేను మీ **SHE Twin AI ఆరోగ్య సహాయకురాలిని**.\n\nమీ ల్యాబ్ పరీక్ష ఫలితాలు (హీమోగ్లోబిన్, TSH, గ్లూకోజ్), మహిళల ఆరోగ్య సందేహాలు లేదా పోషకాహార సూచనల గురించి నన్ను అడగవచ్చు.\n\n*ఈరోజు మీ ఆరోగ్యానికి నేను ఎలా సహాయపడగలను?*`;
      case 'hi':
        return `नमस्ते ${firstName}! मैं आपकी **SHE Twin AI स्वास्थ्य सहायक** हूँ।\n\nमैं आपकी लैब रिपोर्ट (हीमोग्लोबिन, थायरॉइड, ग्लूकोज), महिला स्वास्थ्य और पोषण मार्गदर्शन में आपकी मदद कर सकती हूँ।\n\n*आज मैं आपके स्वास्थ्य में क्या सहायता कर सकती हूँ?*`;
      default:
        return `Hello ${firstName}! I am your **SHE Twin AI Health Assistant**.\n\nI can help you understand your uploaded lab reports, explain medical test parameters (like Hemoglobin, TSH, Lipid profiles), or provide nutritional and wellness guidance.\n\n*How can I assist your health journey today?*`;
    }
  };

  const getInitialFollowUps = (stage: string = lifeStage) => {
    const stg = stage.toLowerCase();

    if (stg.includes('pregnancy')) {
      switch (language) {
        case 'te':
          return ['మూడవ త్రైమాసికంలో కిక్స్ కౌంట్ మార్గదర్శకాలు', 'గర్భధారణ వికారం మరియు ఎసిడిటీ తగ్గడానికి చిట్కాలు', 'ప్రసవానికి ముందు అత్యవసర ప్రమాద సంకేతాలు', 'నడుము నొప్పి మరియు కాళ్ళ వాపుల నివారణ'];
        case 'hi':
          return ['तीसरी तिमाही में बच्चे की हलचल कैसे ट्रैक करें?', 'गर्भावस्था में उल्टी और जी मिचलाने के सुरक्षित उपाय', 'गर्भावस्था के दौरान तुरंत डॉक्टर को दिखाने वाले संकेत', 'कमर दर्द और पैरों की सूजन कम करने के उपाय'];
        default:
          return [
            'Track third trimester fetal kick counts & guidelines',
            'Safe remedies for pregnancy nausea & acid reflux',
            'Warning signs requiring urgent maternity triage',
            'Managing back pain and swelling in feet safely',
          ];
      }
    }

    if (stg.includes('postpartum')) {
      switch (language) {
        case 'te':
          return ['ప్రసవానంతర రక్తస్రావం (లోకియా) రికవరీ సమయం', 'రొమ్ము నొప్పి మరియు పాలు సరిగ్గా రావడానికి చిట్కాలు', 'సిజేరియన్ గాయం త్వరగా మానడానికి జాగ్రత్తలు', 'ప్రసవానంతర మానసిక ప్రశాంతత సలహాలు'];
        case 'hi':
          return ['डिलीवरी के बाद ब्लीडिंग और रिकवरी की समयसीमा', 'स्तनों में दर्द और सूजन कम करने के उपाय', 'सिजेरियन डिलीवरी के बाद टांकों की देखभाल', 'प्रसवोत्तर मानसिक तनाव दूर करने के उपाय'];
        default:
          return [
            'Postpartum bleeding (lochia) healing timeline',
            'Relief for breastfeeding engorgement & nipple care',
            'C-section incision & perineal recovery guidelines',
            'Postpartum mood changes & emotional wellness support',
          ];
      }
    }

    if (stg.includes('teen') || stg.includes('young women')) {
      switch (language) {
        case 'te':
          return ['స్కూల్ సమయంలో తీవ్రమైన పీరియడ్స్ నొప్పి తగ్గడానికి చిట్కాలు', 'మొదటి 2 ఏళ్ళు పీరియడ్స్ సరిగ్గా రాకపోవడం సాధారణమేనా?', 'టీనేజ్ లో రక్తహీనత మరియు నీరసం తగ్గించే ఆహారం', 'మొటిమలు రాకుండా చర్మ సంరక్షణ సలహాలు'];
        case 'hi':
          return ['पीरियड्स के असहनीय दर्द से राहत पाने के आसान उपाय', 'शुरुआती सालों में अनियमित पीरियड्स क्या सामान्य हैं?', 'किशोरियों में मुहांसे और खून की कमी दूर करने वाले आहार', 'दैनिक ऊर्जा और पढ़ाई के दौरान एकाग्रता के टिप्स'];
        default:
          return [
            'Relief for severe menstrual cramps during school days',
            'Is an irregular cycle normal in the first 2 years?',
            'Hormonal acne skincare and balanced diet tips',
            'Preventing adolescent iron deficiency & fatigue',
          ];
      }
    }

    if (stg.includes('menopause')) {
      switch (language) {
        case 'te':
          return ['వేడి ఆవిర్లు (Hot Flashes) సహజంగా తగ్గించుకునే మార్గాలు', 'మెనోపాజ్ లో ఎముకల బలానికి అవసరమైన కాల్షియం ఆహారం', 'నిద్రలేమి మరియు మూడ్ స్వింగ్స్ నిర్వహణ', 'గుండె ఆరోగ్యం మరియు హార్మోన్ల సమతుల్యత'];
        case 'hi':
          return ['अचानक तेज गर्मी (Hot Flashes) और पसीना आने के उपाय', 'मेनोपॉज में हड्डियों की मजबूती के लिए कैल्शियम आहार', 'नींद की समस्या और चिड़चिड़ापन कैसे संभालें?', 'हार्ट हेल्थ और हार्मोन संतुलन के सुझाव'];
        default:
          return [
            'Managing hot flashes and night sweats naturally',
            'Protecting bone density & calcium nutrition after 45',
            'Perimenopause sleep disruptions & mood swings',
            'Cardiovascular wellness and hormone balance',
          ];
      }
    }

    if (stg.includes('reproductive')) {
      switch (language) {
        case 'te':
          return ['PCOS ను సహజంగా అదుపులో ఉంచే డైట్ చిట్కాలు', 'అనిశ్చిత పీరియడ్స్ మరియు అండోత్సర్గము ట్రాకింగ్', 'అధిక రక్తస్రావం మరియు కడుపునొప్పి విశ్లేషణ'];
        case 'hi':
          return ['PCOS और हार्मोनल संतुलन के लिए सही डाइट प्लान', 'अनियमित पीरियड्स और ओव्यूलेशन को कैसे ट्रैक करें?', 'मासिक धर्म में भारी रक्तस్రాव के कारण और उपाय'];
        default:
          return [
            'PCOS diet and lifestyle management guidelines',
            'Tracking ovulation and irregular menstrual cycles',
            'Understanding heavy menstrual bleeding causes',
            'Pelvic pain and hormonal balance evaluation',
          ];
      }
    }

    if (stg.includes('family')) {
      switch (language) {
        case 'te':
          return ['కుటుంబ సభ్యుల ప్రసవానంతర రికవరీలో ఎలా తోడ్పడాలి?', 'ఇంటి వద్ద రోగి సంరక్షణ చెక్‌లిస్ట్', 'డాక్టర్ వద్దకు వెళ్ళే ముందు అడగాల్సిన ప్రశ్నలు'];
        case 'hi':
          return ['नई मां के शारीरिक और मानसिक आराम में कैसे सहयोग करें?', 'मरीज की घरेलू देखभाल के लिए आवश्यक सावधानियां', 'डॉक्टर से मिलने से पहले तैयार किए जाने वाले प्रश्न'];
        default:
          return [
            'How to support a loved one through postpartum healing',
            'Caregiver checklist for post-surgery home recovery',
            'Key questions to prepare for a doctor consultation',
            'Recognizing emergency medical red-flags at home',
          ];
      }
    }

    switch (language) {
      case 'te':
        return ['నా తాజా రక్త పరీక్ష (CBC) నివేదికను వివరించండి', 'ఆహారంలో ఐరన్ పెంచడానికి చిట్కాలు', 'PCOS మరియు రుతుచక్ర సమతుల్యత సూచనలు'];
      case 'hi':
        return ['मेरी नवीनतम CBC रिपोर्ट का विश्लेषण करें', 'भोजन में आयरन बढ़ाने के उपाय', 'मासिक धर्म और हार्मोनल संतुलन के टिप्स'];
      default:
        return [
          'Explain my latest CBC and Iron report',
          'How can I boost iron absorption with meals?',
          'What lifestyle habits support PCOS & cycle balance?',
          'Optimal target ranges for fasting blood sugar',
        ];
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial_msg',
      sender: 'assistant',
      content: getInitialAssistantGreeting(),
      timestamp: 'Just now',
      isDemoSimulation: true,
      suggestedFollowUps: getInitialFollowUps(),
      sources: ['Digital Health Twin Knowledge Base', 'Standard Clinical Guidelines'],
    },
  ]);

  // When language or lifeStage changes, update initial assistant message if no conversation happened yet
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'initial_msg') {
      setMessages([
        {
          id: 'initial_msg',
          sender: 'assistant',
          content: getInitialAssistantGreeting(lifeStage),
          timestamp: 'Just now',
          isDemoSimulation: true,
          suggestedFollowUps: getInitialFollowUps(lifeStage),
          sources: ['Digital Health Twin Knowledge Base', 'Standard Clinical Guidelines'],
        },
      ]);
    }
  }, [language, lifeStage]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isTyping) return;

    const userMessage: ChatMessage = {
      id: `usr_msg_${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    // Call API service with the selected language
    const res = await apiService.sendAssistantMessage(prompt, language);
    setIsTyping(false);

    if (res.data) {
      setMessages((prev) => [...prev, res.data!]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    info('Copied', 'Assistant response copied to clipboard.');
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `fresh_${Date.now()}`,
        sender: 'assistant',
        content: getInitialAssistantGreeting(),
        timestamp: 'Just now',
        isDemoSimulation: true,
        suggestedFollowUps: getInitialFollowUps(),
      },
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-160px)]">
      {/* Top Header & Disclaimer */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
            <BotMessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy-950 tracking-tight">
                {t('page.assistant.title', 'AI Health Assistant')}
              </h2>
              <Badge variant="teal" size="sm">Educational AI</Badge>
              {lifeStage && (
                <Badge variant="navy" size="sm" className="hidden sm:inline-flex">
                  Mode: {lifeStage}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {t('page.assistant.subtitle', 'Personalized health terminology & wellness knowledge')}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearChat}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          {t('assistant.clear', 'Clear Chat')}
        </Button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-snug">
        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          {t('assistant.disclaimer', 'SHE AI provides educational healthcare guidance. Consult a doctor for medical emergencies.')}
        </div>
      </div>

      {/* Main Chat Scroll Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-soft p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm mt-1">
                  AI
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-sm max-w-none text-current">
                    {msg.content}
                  </div>

                  {!isUser && (
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {msg.isDemoSimulation && (
                          <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-semibold">
                            AI Simulation
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 hover:text-slate-700 text-slate-400 rounded transition"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Follow up pills */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedFollowUps.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        className="text-xs bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full transition flex items-center gap-1 shadow-xs"
                      >
                        <span>{prompt}</span>
                        <ArrowRight className="w-3 h-3 text-teal-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-navy-800 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm mt-1">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <span className="inline-block w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              <span>{t('common.loading', 'Analyzing health context...')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-300 shadow-soft focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={t('assistant.placeholder', 'Ask any health question in your preferred language...')}
          className="flex-1 px-3 py-2 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!inputPrompt.trim() || isTyping}
          leftIcon={<Send className="w-4 h-4" />}
        >
          {t('assistant.send', 'Send')}
        </Button>
      </form>
    </div>
  );
};
