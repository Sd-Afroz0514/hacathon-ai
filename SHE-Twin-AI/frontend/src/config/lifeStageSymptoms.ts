export interface ModeQuestionOption {
  value: string;
  labelKey: string;
  defaultLabel: string;
}

export interface ModeQuestion {
  id: string;
  labelKey: string;
  defaultLabel: string;
  type: 'select' | 'number' | 'radio';
  options?: ModeQuestionOption[];
  min?: number;
  max?: number;
  placeholderKey?: string;
  defaultPlaceholder?: string;
  condition?: (answers: Record<string, any>) => boolean;
}

export interface ModeSymptomItem {
  id: string;
  name: string;
  labelKey: string;
  defaultLabel: string;
  isRedFlag?: boolean;
  minWeeks?: number; // for pregnancy trimester filtering
  maxWeeks?: number;
  category?: string;
}

export interface LifeStageSymptomConfig {
  modeId: string;
  modeName: string;
  nameKey: string;
  descriptionKey: string;
  defaultDescription: string;
  questions: ModeQuestion[];
  symptoms: ModeSymptomItem[];
}

export const LIFE_STAGE_CONFIGS: Record<string, LifeStageSymptomConfig> = {
  'Teen / Young Women': {
    modeId: 'Teen / Young Women',
    modeName: 'Teen / Young Women',
    nameKey: 'lifestage.teen',
    descriptionKey: 'symptoms.teen.desc',
    defaultDescription: 'Symptom assessment tailored for adolescence, first menstrual cycles, and academic wellness.',
    questions: [
      {
        id: 'teenAge',
        labelKey: 'question.teen.age',
        defaultLabel: 'Age (Years)',
        type: 'number',
        min: 10,
        max: 22,
        defaultPlaceholder: 'e.g. 16'
      },
      {
        id: 'menarcheAge',
        labelKey: 'question.teen.menarche',
        defaultLabel: 'Age at first period (Menarche)',
        type: 'select',
        options: [
          { value: 'under_11', labelKey: 'opt.menarche.under11', defaultLabel: 'Under 11 years' },
          { value: '11_12', labelKey: 'opt.menarche.11_12', defaultLabel: '11 to 12 years' },
          { value: '13_14', labelKey: 'opt.menarche.13_14', defaultLabel: '13 to 14 years' },
          { value: '15_plus', labelKey: 'opt.menarche.15plus', defaultLabel: '15+ years' },
          { value: 'not_yet', labelKey: 'opt.menarche.notYet', defaultLabel: 'Not started yet' },
        ]
      },
      {
        id: 'cycleRegularity',
        labelKey: 'question.teen.regularity',
        defaultLabel: 'Menstrual cycle regularity',
        type: 'select',
        options: [
          { value: 'regular', labelKey: 'opt.regularity.regular', defaultLabel: 'Regular (21-35 days)' },
          { value: 'irregular', labelKey: 'opt.regularity.irregular', defaultLabel: 'Irregular / Unpredictable' },
          { value: 'just_started', labelKey: 'opt.regularity.justStarted', defaultLabel: 'Just started (< 1 year)' },
        ]
      },
      {
        id: 'bleedingDuration',
        labelKey: 'question.teen.duration',
        defaultLabel: 'Duration of menstrual bleeding',
        type: 'select',
        options: [
          { value: '2_3_days', labelKey: 'opt.duration.2_3d', defaultLabel: '2 to 3 days' },
          { value: '4_7_days', labelKey: 'opt.duration.4_7d', defaultLabel: '4 to 7 days' },
          { value: 'over_7_days', labelKey: 'opt.duration.over7d', defaultLabel: 'More than 7 days' },
        ]
      },
      {
        id: 'dailyImpact',
        labelKey: 'question.teen.impact',
        defaultLabel: 'Do symptoms affect school or daily activities?',
        type: 'select',
        options: [
          { value: 'none', labelKey: 'opt.impact.none', defaultLabel: 'No, not at all' },
          { value: 'mild', labelKey: 'opt.impact.mild', defaultLabel: 'Mild / Occasionally' },
          { value: 'severe', labelKey: 'opt.impact.severe', defaultLabel: 'Yes, severe (missing school/activities)' },
        ]
      }
    ],
    symptoms: [
      { id: 'fatigue', name: 'Fatigue or frequent tiredness', labelKey: 'symptom.fatigueFrequent', defaultLabel: 'Fatigue or frequent tiredness' },
      { id: 'dizziness', name: 'Dizziness or lightheadedness', labelKey: 'symptom.dizzinessLight', defaultLabel: 'Dizziness or lightheadedness' },
      { id: 'heavy_bleeding', name: 'Heavy menstrual bleeding', labelKey: 'symptom.heavyBleedingTeen', defaultLabel: 'Heavy menstrual bleeding' },
      { id: 'irregular_periods', name: 'Irregular periods', labelKey: 'symptom.irregularPeriodsTeen', defaultLabel: 'Irregular periods' },
      { id: 'severe_cramps', name: 'Severe menstrual cramps', labelKey: 'symptom.severeCrampsTeen', defaultLabel: 'Severe menstrual cramps' },
      { id: 'acne_skin', name: 'Acne or skin changes', labelKey: 'symptom.acneSkin', defaultLabel: 'Acne or skin changes' },
      { id: 'hair_loss', name: 'Hair loss', labelKey: 'symptom.hairLossTeen', defaultLabel: 'Hair loss' },
      { id: 'appetite_changes', name: 'Changes in appetite', labelKey: 'symptom.appetiteChanges', defaultLabel: 'Changes in appetite' },
      { id: 'sleep_difficulty', name: 'Difficulty sleeping', labelKey: 'symptom.sleepDifficulty', defaultLabel: 'Difficulty sleeping' },
      { id: 'mood_changes', name: 'Mood changes', labelKey: 'symptom.moodChanges', defaultLabel: 'Mood changes' },
      { id: 'concentration', name: 'Difficulty concentrating', labelKey: 'symptom.concentration', defaultLabel: 'Difficulty concentrating' },
    ]
  },

  'Reproductive Health': {
    modeId: 'Reproductive Health',
    modeName: 'Reproductive Health',
    nameKey: 'lifestage.reproductive',
    descriptionKey: 'symptoms.reproductive.desc',
    defaultDescription: 'Assessment for cycle regularity, hormonal balance, PCOS indicators, and pelvic comfort.',
    questions: [
      {
        id: 'lmpTimeframe',
        labelKey: 'question.reproductive.lmp',
        defaultLabel: 'Last menstrual period (LMP)',
        type: 'select',
        options: [
          { value: 'last_30_days', labelKey: 'opt.lmp.last30', defaultLabel: 'Within last 30 days' },
          { value: '1_3_months', labelKey: 'opt.lmp.1_3m', defaultLabel: '1 to 3 months ago' },
          { value: 'over_3_months', labelKey: 'opt.lmp.over3m', defaultLabel: 'Over 3 months ago' },
          { value: 'currently_bleeding', labelKey: 'opt.lmp.current', defaultLabel: 'Currently bleeding' },
        ]
      },
      {
        id: 'cycleLength',
        labelKey: 'question.reproductive.cycleLength',
        defaultLabel: 'Typical cycle length',
        type: 'select',
        options: [
          { value: '21_27', labelKey: 'opt.cycle.21_27', defaultLabel: '21 to 27 days' },
          { value: '28_32', labelKey: 'opt.cycle.28_32', defaultLabel: '28 to 32 days' },
          { value: '33_45', labelKey: 'opt.cycle.33_45', defaultLabel: '33 to 45 days' },
          { value: 'unpredictable', labelKey: 'opt.cycle.unpredictable', defaultLabel: 'Unpredictable / Over 45 days' },
        ]
      },
      {
        id: 'periodRegularity',
        labelKey: 'question.reproductive.regularity',
        defaultLabel: 'Are periods regular?',
        type: 'select',
        options: [
          { value: 'regular', labelKey: 'opt.period.regular', defaultLabel: 'Yes, predictable rhythm' },
          { value: 'irregular', labelKey: 'opt.period.irregular', defaultLabel: 'Frequently irregular / skipped' },
          { value: 'absent', labelKey: 'opt.period.absent', defaultLabel: 'Absent for prolonged periods' },
        ]
      },
      {
        id: 'symptomDuration',
        labelKey: 'question.reproductive.duration',
        defaultLabel: 'Duration of symptoms',
        type: 'select',
        options: [
          { value: 'under_1m', labelKey: 'opt.sympDur.under1m', defaultLabel: 'Less than 1 month' },
          { value: '1_3m', labelKey: 'opt.sympDur.1_3m', defaultLabel: '1 to 3 months' },
          { value: '3_6m', labelKey: 'opt.sympDur.3_6m', defaultLabel: '3 to 6 months' },
          { value: 'over_6m', labelKey: 'opt.sympDur.over6m', defaultLabel: 'Over 6 months' },
        ]
      },
      {
        id: 'diagnosedConditions',
        labelKey: 'question.reproductive.conditions',
        defaultLabel: 'Clinician-diagnosed conditions (if any)',
        type: 'select',
        options: [
          { value: 'none', labelKey: 'opt.diag.none', defaultLabel: 'None diagnosed' },
          { value: 'pcos', labelKey: 'opt.diag.pcos', defaultLabel: 'PCOS / PCOD' },
          { value: 'endometriosis', labelKey: 'opt.diag.endo', defaultLabel: 'Endometriosis' },
          { value: 'thyroid', labelKey: 'opt.diag.thyroid', defaultLabel: 'Thyroid disorder' },
          { value: 'other', labelKey: 'opt.diag.other', defaultLabel: 'Other condition' },
        ]
      }
    ],
    symptoms: [
      { id: 'irregular_missed', name: 'Irregular or missed periods', labelKey: 'symptom.irregularMissed', defaultLabel: 'Irregular or missed periods' },
      { id: 'heavy_bleeding_rep', name: 'Heavy menstrual bleeding', labelKey: 'symptom.heavyBleedingRep', defaultLabel: 'Heavy menstrual bleeding' },
      { id: 'severe_period_pain', name: 'Severe period pain', labelKey: 'symptom.severePeriodPain', defaultLabel: 'Severe period pain' },
      { id: 'pelvic_pain', name: 'Pelvic or lower abdominal pain', labelKey: 'symptom.pelvicPainRep', defaultLabel: 'Pelvic or lower abdominal pain' },
      { id: 'acne_oily_skin', name: 'Acne or oily skin', labelKey: 'symptom.acneOily', defaultLabel: 'Acne or oily skin' },
      { id: 'facial_body_hair', name: 'Excessive facial or body hair', labelKey: 'symptom.facialBodyHair', defaultLabel: 'Excessive facial or body hair' },
      { id: 'hair_thinning_rep', name: 'Hair thinning', labelKey: 'symptom.hairThinningRep', defaultLabel: 'Hair thinning' },
      { id: 'unusual_fatigue', name: 'Unusual fatigue', labelKey: 'symptom.unusualFatigue', defaultLabel: 'Unusual fatigue' },
      { id: 'weight_changes', name: 'Unexpected weight changes', labelKey: 'symptom.weightChanges', defaultLabel: 'Unexpected weight changes' },
      { id: 'cycle_tracking_diff', name: 'Difficulty tracking menstrual cycles', labelKey: 'symptom.trackingDifficulty', defaultLabel: 'Difficulty tracking menstrual cycles' },
    ]
  },

  'Pregnancy': {
    modeId: 'Pregnancy',
    modeName: 'Pregnancy',
    nameKey: 'lifestage.pregnancy',
    descriptionKey: 'symptoms.pregnancy.desc',
    defaultDescription: 'Trimester-specific antenatal screening, fetal wellbeing checks, and red-flag alerts.',
    questions: [
      {
        id: 'pregnancyWeeks',
        labelKey: 'question.pregnancy.weeks',
        defaultLabel: 'How many weeks pregnant are you?',
        type: 'number',
        min: 1,
        max: 42,
        defaultPlaceholder: 'e.g. 18'
      },
      {
        id: 'firstPregnancy',
        labelKey: 'question.pregnancy.first',
        defaultLabel: 'Is this your first pregnancy?',
        type: 'select',
        options: [
          { value: 'yes', labelKey: 'opt.firstPreg.yes', defaultLabel: 'Yes, first pregnancy' },
          { value: 'no', labelKey: 'opt.firstPreg.no', defaultLabel: 'No, previous pregnancy' },
          { value: 'skip', labelKey: 'opt.firstPreg.skip', defaultLabel: 'Prefer not to say' },
        ]
      },
      {
        id: 'antenatalCheckups',
        labelKey: 'question.pregnancy.antenatal',
        defaultLabel: 'Have you attended your antenatal check-ups?',
        type: 'select',
        options: [
          { value: 'up_to_date', labelKey: 'opt.antenatal.upToDate', defaultLabel: 'Yes, up to date' },
          { value: 'scheduled_soon', labelKey: 'opt.antenatal.soon', defaultLabel: 'Scheduled soon' },
          { value: 'overdue', labelKey: 'opt.antenatal.overdue', defaultLabel: 'Overdue / Need appointment' },
        ]
      },
      {
        id: 'uploadedReport',
        labelKey: 'question.pregnancy.report',
        defaultLabel: 'Have you uploaded an antenatal or laboratory report?',
        type: 'select',
        options: [
          { value: 'yes', labelKey: 'opt.pregReport.yes', defaultLabel: 'Yes, in Reports section' },
          { value: 'not_yet', labelKey: 'opt.pregReport.notYet', defaultLabel: 'Not yet / Physical records with me' },
        ]
      },
      {
        id: 'fetalMovementStatus',
        labelKey: 'question.pregnancy.fetalMovement',
        defaultLabel: 'Daily fetal movements (kicks) status',
        type: 'select',
        condition: (answers: Record<string, any>) => {
          const w = parseInt(answers['pregnancyWeeks'] || '14');
          return !isNaN(w) && w >= 20;
        },
        options: [
          { value: 'normal', labelKey: 'opt.fetalMovement.normal', defaultLabel: 'Regular active kicks felt daily' },
          { value: 'reduced', labelKey: 'opt.fetalMovement.reduced', defaultLabel: 'Reduced or fewer kicks than usual' },
          { value: 'none_today', labelKey: 'opt.fetalMovement.noneToday', defaultLabel: 'No kicks felt today / noticeable decrease' },
        ]
      }
    ],
    symptoms: [
      // Standard pregnancy symptoms
      { id: 'nausea_vomiting', name: 'Nausea or vomiting', labelKey: 'symptom.nauseaVomiting', defaultLabel: 'Nausea or vomiting', maxWeeks: 28 },
      { id: 'preg_fatigue', name: 'Fatigue or unusual weakness', labelKey: 'symptom.pregFatigue', defaultLabel: 'Fatigue or unusual weakness' },
      { id: 'preg_dizziness', name: 'Dizziness', labelKey: 'symptom.pregDizziness', defaultLabel: 'Dizziness' },
      { id: 'heartburn', name: 'Heartburn', labelKey: 'symptom.heartburn', defaultLabel: 'Heartburn', minWeeks: 12 },
      { id: 'constipation', name: 'Constipation', labelKey: 'symptom.constipation', defaultLabel: 'Constipation' },
      { id: 'back_pain_preg', name: 'Back pain', labelKey: 'symptom.backPainPreg', defaultLabel: 'Back pain', minWeeks: 12 },
      { id: 'mild_swelling_feet', name: 'Mild swelling of feet', labelKey: 'symptom.mildSwellingFeet', defaultLabel: 'Mild swelling of feet', minWeeks: 14 },
      { id: 'preg_headache', name: 'Headache', labelKey: 'symptom.pregHeadache', defaultLabel: 'Headache' },
      { id: 'appetite_changes_preg', name: 'Changes in appetite', labelKey: 'symptom.appetiteChangesPreg', defaultLabel: 'Changes in appetite' },
      { id: 'sleep_diff_preg', name: 'Difficulty sleeping', labelKey: 'symptom.sleepDiffPreg', defaultLabel: 'Difficulty sleeping' },
      { id: 'abdominal_discomfort', name: 'Abdominal discomfort', labelKey: 'symptom.abdominalDiscomfort', defaultLabel: 'Abdominal discomfort' },
      { id: 'fever_preg', name: 'Fever', labelKey: 'symptom.feverPreg', defaultLabel: 'Fever', isRedFlag: true },

      // Critical Red-Flags (Urgent Care required)
      { id: 'vaginal_bleeding_preg', name: 'Vaginal bleeding', labelKey: 'symptom.vaginalBleedingPreg', defaultLabel: 'Vaginal bleeding', isRedFlag: true },
      { id: 'fluid_leakage', name: 'Leakage of fluid', labelKey: 'symptom.fluidLeakage', defaultLabel: 'Leakage of fluid', isRedFlag: true, minWeeks: 14 },
      { id: 'severe_abdominal_pain_preg', name: 'Severe abdominal pain', labelKey: 'symptom.severeAbdominalPainPreg', defaultLabel: 'Severe abdominal pain', isRedFlag: true },
      { id: 'fetal_movement_reduced', name: 'Reduced or changed fetal movement', labelKey: 'symptom.fetalMovementReduced', defaultLabel: 'Reduced or changed fetal movement', isRedFlag: true, minWeeks: 20 },
      { id: 'severe_persistent_vomiting', name: 'Severe or persistent vomiting', labelKey: 'symptom.severeVomitingPreg', defaultLabel: 'Severe or persistent vomiting', isRedFlag: true },
      { id: 'blurred_vision_headache', name: 'Blurred vision or severe headache', labelKey: 'symptom.blurredVisionHeadache', defaultLabel: 'Blurred vision or severe headache', isRedFlag: true, minWeeks: 14 },
      { id: 'sudden_swelling_face_hands', name: 'Sudden swelling of face or hands', labelKey: 'symptom.suddenSwellingFaceHands', defaultLabel: 'Sudden swelling of face or hands', isRedFlag: true, minWeeks: 14 },
      { id: 'contractions_preg', name: 'Contractions or persistent uterine tightening', labelKey: 'symptom.contractionsPreg', defaultLabel: 'Contractions or persistent uterine tightening', isRedFlag: true, minWeeks: 24 },
      { id: 'diff_breathing_chest_preg', name: 'Difficulty breathing or chest pain', labelKey: 'symptom.diffBreathingChestPreg', defaultLabel: 'Difficulty breathing or chest pain', isRedFlag: true },
    ]
  },

  'Postpartum': {
    modeId: 'Postpartum',
    modeName: 'Postpartum',
    nameKey: 'lifestage.postpartum',
    descriptionKey: 'symptoms.postpartum.desc',
    defaultDescription: 'Fourth trimester maternal healing, lactation wellness, wound recovery, and mental wellbeing.',
    questions: [
      {
        id: 'postpartumTimeframe',
        labelKey: 'question.postpartum.timeframe',
        defaultLabel: 'How long ago did you give birth?',
        type: 'select',
        options: [
          { value: '0_2_weeks', labelKey: 'opt.ppTime.0_2w', defaultLabel: '0 to 2 weeks' },
          { value: '3_6_weeks', labelKey: 'opt.ppTime.3_6w', defaultLabel: '3 to 6 weeks' },
          { value: '6_12_weeks', labelKey: 'opt.ppTime.6_12w', defaultLabel: '6 to 12 weeks' },
          { value: 'over_3_months', labelKey: 'opt.ppTime.over3m', defaultLabel: 'Over 3 months' },
        ]
      },
      {
        id: 'deliveryType',
        labelKey: 'question.postpartum.delivery',
        defaultLabel: 'Was the delivery vaginal or by C-section?',
        type: 'select',
        options: [
          { value: 'vaginal', labelKey: 'opt.deliv.vaginal', defaultLabel: 'Vaginal delivery' },
          { value: 'c_section', labelKey: 'opt.deliv.cSection', defaultLabel: 'C-Section delivery' },
          { value: 'skip', labelKey: 'opt.deliv.skip', defaultLabel: 'Prefer not to say' },
        ]
      },
      {
        id: 'breastfeedingStatus',
        labelKey: 'question.postpartum.breastfeeding',
        defaultLabel: 'Are you breastfeeding?',
        type: 'select',
        options: [
          { value: 'exclusive', labelKey: 'opt.bf.exclusive', defaultLabel: 'Exclusively breastfeeding' },
          { value: 'mixed', labelKey: 'opt.bf.mixed', defaultLabel: 'Formula / Mixed feeding' },
          { value: 'not_bf', labelKey: 'opt.bf.notBf', defaultLabel: 'Not breastfeeding' },
        ]
      },
      {
        id: 'postpartumCheckup',
        labelKey: 'question.postpartum.checkup',
        defaultLabel: 'Have you attended a postpartum check-up?',
        type: 'select',
        options: [
          { value: 'yes', labelKey: 'opt.ppCheck.yes', defaultLabel: 'Yes, completed check-up' },
          { value: 'scheduled', labelKey: 'opt.ppCheck.scheduled', defaultLabel: 'Scheduled soon' },
          { value: 'not_yet', labelKey: 'opt.ppCheck.notYet', defaultLabel: 'Not yet scheduled' },
        ]
      }
    ],
    symptoms: [
      { id: 'heavy_bleeding_pp', name: 'Heavy vaginal bleeding', labelKey: 'symptom.heavyBleedingPP', defaultLabel: 'Heavy vaginal bleeding', isRedFlag: true },
      { id: 'fever_chills_pp', name: 'Fever or chills', labelKey: 'symptom.feverChillsPP', defaultLabel: 'Fever or chills', isRedFlag: true },
      { id: 'severe_abdominal_pain_pp', name: 'Severe abdominal pain', labelKey: 'symptom.severeAbdominalPainPP', defaultLabel: 'Severe abdominal pain', isRedFlag: true },
      { id: 'wound_pain_redness', name: 'Pain or redness around C-section or delivery wound', labelKey: 'symptom.woundPainRedness', defaultLabel: 'Pain or redness around C-section or delivery wound', isRedFlag: true },
      { id: 'breast_pain_redness', name: 'Breast pain or redness', labelKey: 'symptom.breastPainRedness', defaultLabel: 'Breast pain or redness', isRedFlag: true },
      { id: 'breastfeeding_difficulty', name: 'Difficulty breastfeeding', labelKey: 'symptom.breastfeedingDiff', defaultLabel: 'Difficulty breastfeeding' },
      { id: 'persistent_fatigue_pp', name: 'Persistent fatigue', labelKey: 'symptom.persistentFatiguePP', defaultLabel: 'Persistent fatigue' },
      { id: 'dizziness_pp', name: 'Dizziness', labelKey: 'symptom.dizzinessPP', defaultLabel: 'Dizziness' },
      { id: 'severe_headache_pp', name: 'Severe headache', labelKey: 'symptom.severeHeadachePP', defaultLabel: 'Severe headache', isRedFlag: true },
      { id: 'vision_changes_pp', name: 'Vision changes', labelKey: 'symptom.visionChangesPP', defaultLabel: 'Vision changes', isRedFlag: true },
      { id: 'persistent_sadness', name: 'Persistent sadness', labelKey: 'symptom.persistentSadness', defaultLabel: 'Persistent sadness' },
      { id: 'anxiety_overwhelmed', name: 'Anxiety or overwhelming feelings', labelKey: 'symptom.anxietyOverwhelmed', defaultLabel: 'Anxiety or overwhelming feelings' },
      { id: 'sleep_diff_pp', name: 'Difficulty sleeping', labelKey: 'symptom.sleepDiffPP', defaultLabel: 'Difficulty sleeping' },
      { id: 'reduced_appetite_pp', name: 'Reduced appetite', labelKey: 'symptom.reducedAppetitePP', defaultLabel: 'Reduced appetite' },
      { id: 'self_harm_thoughts', name: 'Thoughts of self-harm or harming baby', labelKey: 'symptom.selfHarmThoughts', defaultLabel: 'Thoughts of self-harm or harming baby', isRedFlag: true },
    ]
  },

  'Menopause': {
    modeId: 'Menopause',
    modeName: 'Menopause',
    nameKey: 'lifestage.menopause',
    descriptionKey: 'symptoms.menopause.desc',
    defaultDescription: 'Support for perimenopause and menopause transition, hormonal health, and bone wellness.',
    questions: [
      {
        id: 'menopauseAge',
        labelKey: 'question.menopause.age',
        defaultLabel: 'Age range',
        type: 'select',
        options: [
          { value: 'under_40', labelKey: 'opt.menoAge.under40', defaultLabel: 'Under 40 years' },
          { value: '40_45', labelKey: 'opt.menoAge.40_45', defaultLabel: '40 to 45 years' },
          { value: '46_50', labelKey: 'opt.menoAge.46_50', defaultLabel: '46 to 50 years' },
          { value: '51_55', labelKey: 'opt.menoAge.51_55', defaultLabel: '51 to 55 years' },
          { value: 'over_55', labelKey: 'opt.menoAge.over55', defaultLabel: 'Over 55 years' },
        ]
      },
      {
        id: 'menstrualChanges',
        labelKey: 'question.menopause.menstrual',
        defaultLabel: 'Menstrual changes',
        type: 'select',
        options: [
          { value: 'irregular', labelKey: 'opt.menoMens.irregular', defaultLabel: 'Periods becoming irregular / spacing out' },
          { value: 'stopped_under_12m', labelKey: 'opt.menoMens.under12m', defaultLabel: 'No period for < 12 months (Perimenopause)' },
          { value: 'stopped_over_12m', labelKey: 'opt.menoMens.over12m', defaultLabel: 'No period for > 12 months (Postmenopause)' },
          { value: 'still_regular', labelKey: 'opt.menoMens.regular', defaultLabel: 'Periods still regular' },
        ]
      },
      {
        id: 'symptomDurationMeno',
        labelKey: 'question.menopause.duration',
        defaultLabel: 'Duration of symptoms',
        type: 'select',
        options: [
          { value: 'under_6m', labelKey: 'opt.menoDur.under6m', defaultLabel: 'Less than 6 months' },
          { value: '6_12m', labelKey: 'opt.menoDur.6_12m', defaultLabel: '6 to 12 months' },
          { value: '1_2y', labelKey: 'opt.menoDur.1_2y', defaultLabel: '1 to 2 years' },
          { value: 'over_2y', labelKey: 'opt.menoDur.over2y', defaultLabel: 'Over 2 years' },
        ]
      },
      {
        id: 'dailyImpactMeno',
        labelKey: 'question.menopause.impact',
        defaultLabel: 'Whether symptoms affect sleep or daily activities',
        type: 'select',
        options: [
          { value: 'mild', labelKey: 'opt.menoImpact.mild', defaultLabel: 'Mild / Manageable' },
          { value: 'moderate', labelKey: 'opt.menoImpact.moderate', defaultLabel: 'Moderate disruption' },
          { value: 'severe', labelKey: 'opt.menoImpact.severe', defaultLabel: 'Severe disruption' },
        ]
      }
    ],
    symptoms: [
      { id: 'hot_flashes', name: 'Hot flashes', labelKey: 'symptom.hotFlashesMeno', defaultLabel: 'Hot flashes' },
      { id: 'night_sweats', name: 'Night sweats', labelKey: 'symptom.nightSweats', defaultLabel: 'Night sweats' },
      { id: 'irregular_periods_meno', name: 'Irregular periods', labelKey: 'symptom.irregularPeriodsMeno', defaultLabel: 'Irregular periods' },
      { id: 'sleep_diff_meno', name: 'Sleep difficulties', labelKey: 'symptom.sleepDiffMeno', defaultLabel: 'Sleep difficulties' },
      { id: 'mood_changes_meno', name: 'Mood changes', labelKey: 'symptom.moodChangesMeno', defaultLabel: 'Mood changes' },
      { id: 'vaginal_dryness', name: 'Vaginal dryness', labelKey: 'symptom.vaginalDryness', defaultLabel: 'Vaginal dryness' },
      { id: 'sexual_comfort_changes', name: 'Changes in sexual comfort', labelKey: 'symptom.sexualComfortChanges', defaultLabel: 'Changes in sexual comfort' },
      { id: 'concentration_diff_meno', name: 'Difficulty concentrating', labelKey: 'symptom.concentrationMeno', defaultLabel: 'Difficulty concentrating' },
      { id: 'joint_discomfort', name: 'Joint discomfort', labelKey: 'symptom.jointDiscomfort', defaultLabel: 'Joint discomfort' },
      { id: 'weight_changes_meno', name: 'Changes in weight', labelKey: 'symptom.weightChangesMeno', defaultLabel: 'Changes in weight' },
      { id: 'urinary_symptoms', name: 'Urinary symptoms', labelKey: 'symptom.urinarySymptoms', defaultLabel: 'Urinary symptoms' },
      { id: 'bone_health_concerns', name: 'Bone-health concerns', labelKey: 'symptom.boneHealthConcerns', defaultLabel: 'Bone-health concerns' },
    ]
  },

  'My Health': {
    modeId: 'My Health',
    modeName: 'My Health',
    nameKey: 'lifestage.myhealth',
    descriptionKey: 'symptoms.myhealth.desc',
    defaultDescription: 'General wellness assessment, common acute symptoms, and preventive safety screening.',
    questions: [
      {
        id: 'vitalObservation',
        labelKey: 'question.myhealth.vitals',
        defaultLabel: 'Have you measured vitals (temp/BP) today?',
        type: 'select',
        options: [
          { value: 'normal', labelKey: 'opt.vitals.normal', defaultLabel: 'Yes, recorded within normal range' },
          { value: 'elevated', labelKey: 'opt.vitals.elevated', defaultLabel: 'Yes, elevated or fluctuating' },
          { value: 'not_measured', labelKey: 'opt.vitals.notMeasured', defaultLabel: 'Not measured today' },
        ]
      },
      {
        id: 'symptomProgression',
        labelKey: 'question.myhealth.progression',
        defaultLabel: 'Symptom trajectory',
        type: 'select',
        options: [
          { value: 'new_onset', labelKey: 'opt.prog.new', defaultLabel: 'New onset (started recently)' },
          { value: 'worsening', labelKey: 'opt.prog.worse', defaultLabel: 'Progressively worsening' },
          { value: 'fluctuating', labelKey: 'opt.prog.fluct', defaultLabel: 'Fluctuating on and off' },
        ]
      }
    ],
    symptoms: [
      { id: 'fatigue_gen', name: 'Fatigue', labelKey: 'symptom.fatigueGen', defaultLabel: 'Fatigue' },
      { id: 'fever_gen', name: 'Fever', labelKey: 'symptom.feverGen', defaultLabel: 'Fever' },
      { id: 'headache_gen', name: 'Headache', labelKey: 'symptom.headacheGen', defaultLabel: 'Headache' },
      { id: 'dizziness_gen', name: 'Dizziness', labelKey: 'symptom.dizzinessGen', defaultLabel: 'Dizziness' },
      { id: 'persistent_cough', name: 'Persistent cough', labelKey: 'symptom.persistentCough', defaultLabel: 'Persistent cough' },
      { id: 'nausea_vomiting_gen', name: 'Nausea or vomiting', labelKey: 'symptom.nauseaVomitingGen', defaultLabel: 'Nausea or vomiting' },
      { id: 'appetite_changes_gen', name: 'Changes in appetite', labelKey: 'symptom.appetiteChangesGen', defaultLabel: 'Changes in appetite' },
      { id: 'sleep_diff_gen', name: 'Sleep difficulties', labelKey: 'symptom.sleepDiffGen', defaultLabel: 'Sleep difficulties' },
      { id: 'weight_changes_gen', name: 'Unexpected weight changes', labelKey: 'symptom.weightChangesGen', defaultLabel: 'Unexpected weight changes' },
      { id: 'chest_pain_gen', name: 'Chest pain', labelKey: 'symptom.chestPainGen', defaultLabel: 'Chest pain', isRedFlag: true },
      { id: 'difficulty_breathing', name: 'Difficulty breathing', labelKey: 'symptom.diffBreathing', defaultLabel: 'Difficulty breathing', isRedFlag: true },
    ]
  },

  'Family Ally': {
    modeId: 'Family Ally',
    modeName: 'Family Ally',
    nameKey: 'lifestage.family',
    descriptionKey: 'symptoms.family.desc',
    defaultDescription: 'Support assessment tailored for family members, dependents, or loved ones.',
    questions: [
      {
        id: 'supportedPersonRelation',
        labelKey: 'question.family.relation',
        defaultLabel: 'Who are you supporting?',
        type: 'select',
        options: [
          { value: 'Mother', labelKey: 'opt.rel.mother', defaultLabel: 'Mother' },
          { value: 'Wife or Partner', labelKey: 'opt.rel.wifePartner', defaultLabel: 'Wife or Partner' },
          { value: 'Daughter', labelKey: 'opt.rel.daughter', defaultLabel: 'Daughter' },
          { value: 'Sister', labelKey: 'opt.rel.sister', defaultLabel: 'Sister' },
          { value: 'Friend', labelKey: 'opt.rel.friend', defaultLabel: 'Friend' },
          { value: 'Other', labelKey: 'opt.rel.other', defaultLabel: 'Other' },
        ]
      },
      {
        id: 'supportedPersonMode',
        labelKey: 'question.family.mode',
        defaultLabel: 'Which health mode applies to that person?',
        type: 'select',
        options: [
          { value: 'Teen / Young Women', labelKey: 'lifestage.teen', defaultLabel: 'Teen / Young Women' },
          { value: 'Reproductive Health', labelKey: 'lifestage.reproductive', defaultLabel: 'Reproductive Health' },
          { value: 'Pregnancy', labelKey: 'lifestage.pregnancy', defaultLabel: 'Pregnancy' },
          { value: 'Postpartum', labelKey: 'lifestage.postpartum', defaultLabel: 'Postpartum' },
          { value: 'Menopause', labelKey: 'lifestage.menopause', defaultLabel: 'Menopause' },
          { value: 'My Health', labelKey: 'lifestage.myhealth', defaultLabel: 'My Health' },
        ]
      }
    ],
    symptoms: [] // Dynamically populated from the selected supportedPersonMode
  }
};

// Aliases to ensure consistent matching regardless of naming variants
LIFE_STAGE_CONFIGS['Pregnancy Track'] = LIFE_STAGE_CONFIGS['Pregnancy'];
LIFE_STAGE_CONFIGS['Postpartum Care'] = LIFE_STAGE_CONFIGS['Postpartum'];
LIFE_STAGE_CONFIGS['Menopause Transition'] = LIFE_STAGE_CONFIGS['Menopause'];

export const normalizeModeKey = (mode: string): string => {
  if (!mode) return 'My Health';
  const m = mode.trim().toLowerCase();
  if (m.includes('teen') || m.includes('young women')) return 'Teen / Young Women';
  if (m.includes('reproductive')) return 'Reproductive Health';
  if (m.includes('pregnancy')) return 'Pregnancy';
  if (m.includes('postpartum')) return 'Postpartum';
  if (m.includes('menopause')) return 'Menopause';
  if (m.includes('family')) return 'Family Ally';
  return 'My Health';
};

export const getEffectiveModeConfig = (
  selectedMode: string,
  supportedPersonMode?: string
): LifeStageSymptomConfig => {
  const normSelected = normalizeModeKey(selectedMode);
  if (normSelected === 'Family Ally' && supportedPersonMode) {
    const normSupported = normalizeModeKey(supportedPersonMode);
    const targetConfig = LIFE_STAGE_CONFIGS[normSupported] || LIFE_STAGE_CONFIGS['My Health'];
    return {
      ...targetConfig,
      modeId: 'Family Ally',
      nameKey: 'lifestage.family',
    };
  }
  return LIFE_STAGE_CONFIGS[normSelected] || LIFE_STAGE_CONFIGS['My Health'];
};

export const getValidSymptomNamesForMode = (
  mode: string,
  supportedPersonMode?: string
): string[] => {
  const config = getEffectiveModeConfig(mode, supportedPersonMode);
  return config.symptoms.map((s) => s.name);
};
