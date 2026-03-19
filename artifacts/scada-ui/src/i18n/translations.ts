export type Locale = "en" | "fr";

export const translations = {
  en: {
    uptime: "UPTIME",
    node: "NODE",
    time: "TIME",
    overallStatus: "Overall Status",
    activeAlarms: "Active Alarms",
    mode: "Mode",
    nextAutoFeed: "Next Auto Feed",

    electricalOneLine: "Electrical One-Line",
    commandSafetyControls: "Command / Safety Controls",
    plcStatus: "PLC-001 Status",
    realTimeProcess: "Real-Time Process Values",
    alarmsEvents: "Alarms / Events",
    simulationConfig: "Simulation Configuration",
    gridDetails: "Grid Details",
    generatorUnits: "Generator Units",

    feedCycleActive: "FEED CYCLE ACTIVE",
    startFeedCycle: "START FEED CYCLE",
    refillHopper: "REFILL HOPPER",
    resetEstop: "RESET ESTOP",
    emergencyStop: "EMERGENCY STOP",
    removeBowl: "REMOVE BOWL",
    restoreBowl: "RESTORE BOWL",
    emptyBowl: "EMPTY BOWL",

    controllerHealth: "Controller Health",
    discreteInputs: "Discrete Inputs (DI)",
    discreteOutputs: "Discrete Outputs (DO)",

    supplyVoltage: "Supply Voltage",
    gridFrequency: "Grid Frequency",
    motorCurrent: "Motor Current",
    hopperLevel: "Hopper Level",
    bowlLevelPortion: "Bowl Level / Portion",
    todaysFeeds: "Today's Feeds",
    systemMode: "System Mode",
    lastFeedTime: "Last Feed Time",
    processSynopsis: "Process Synopsis",
    openGridSimulation: "OPEN GRID SIMULATION PAGE",

    synopsisFault:
      "Feeder locked out due to protection condition. Reset fault inputs before restart.",
    synopsisFeedActive:
      "Motor and hopper gate are energized. Dry feed is being metered into the bowl.",
    synopsisPowered:
      "Electrical bus healthy. PLC armed and waiting for bowl demand / scheduled feed.",
    synopsisUnpowered:
      "Main disconnect open or power unavailable. Downstream control circuit is de-energized.",

    alarmActive: "ACTIVE",
    alarmEvent: "EVENT",

    openFullPage: "Open full page",
    exitFullWindow: "Exit full window",
    fullWindow: "Full window",

    notFoundTitle: "404 Page Not Found",
    notFoundDesc: "Did you forget to add the page to the router?",

    inBand: "IN BAND",
    outOfBand: "OUT OF BAND",
    nominal: "Nominal",
    deviation: "Deviation",
    band: "Band (±)",

    parameter: "Parameter",
    value: "Value",
    description: "Description",
    abbreviationUnit: "Abbreviation / Unit",

    nominalVoltage: "Nominal Voltage",
    liveVoltage: "Live Voltage",
    minAllowed: "Min Allowed",
    maxAllowed: "Max Allowed",
    voltageDeviation: "Voltage Deviation",
    voltageTolerance: "Voltage Tolerance",
    nominalFrequency: "Nominal Frequency",
    liveFrequency: "Live Frequency",
    freqMin: "Freq Min",
    freqMax: "Freq Max",
    freqDeviation: "Freq Deviation",
    freqBand: "Freq Band (±)",
    sampleInterval: "Sample Interval",
    historySamples: "History Samples",
    voltageStatus: "Voltage Status",
    freqStatus: "Freq Status",

    genStateOffline: "OFFLINE",
    genStateStarting: "STARTING",
    genStateStabilizing: "STABILIZING",
    genStateAvailable: "AVAILABLE",
    genStateOnBus: "ON BUS",
    genStateStopping: "STOPPING",

    phaseCranking: "CRANKING",
    phaseBuildingVoltage: "BUILDING VOLTAGE",
    phaseReachingRatedSpeed: "REACHING RATED SPEED",
    phaseReadyForAts: "READY FOR ATS TRANSFER",

    fuel: "FUEL",
    start: "START",
    stop: "STOP",
    startingEllipsis: "STARTING...",
    stoppingEllipsis: "STOPPING...",
    liveValuesReflected:
      "Live values are reflected in the Electrical One-Line diagram",
    viewDiagram: "VIEW DIAGRAM →",
    viewInOneLine: "View in One-Line →",

    electricalOneLineHeader: "ELECTRICAL ONE-LINE",
    gridDetailsButton: "GRID DETAILS",

    atsOnUtility: "ATS ON UTILITY",
    atsOnEmergency: "ATS ON EMERGENCY",
    openNoSource: "OPEN — NO SOURCE",
    energized: "ENERGIZED",
    unavailable: "UNAVAILABLE",
    deEnergized: "DE-ENERGIZED",
    stopped: "STOPPED",
    running: "RUNNING",
    standby: "STANDBY",
    monitoring: "MONITORING",
    dead: "DEAD",
    closed: "CLOSED",
    open: "OPEN",
    tripped: "TRIPPED",
    ok: "OK",
    noFeed: "NO FEED",
    openStandby: "OPEN / STANDBY",
    standbyOffline: "STANDBY / OFFLINE",
    campus: "CAMPUS",

    gridStabilityDesc: "Grid stability indicator.",
    supplyVoltageDesc: (nominalVoltage: number) =>
      `Supply voltage at MCC bus (nominal ${nominalVoltage} V).`,
    totalLoadCurrentDesc: "Total load current drawn from supply.",
    realPowerDesc: "Real power actively consumed by load.",
    totalVADesc: "Total volt-ampere demand on the supply.",
    reactiveDesc: "Reactive component — essential for grid balance.",
    efficiencyDesc: "Energy efficiency ratio. Motor load, nominally 0.88.",

    motorVoltageDesc: (nominalVoltage: number) =>
      `Motor terminal voltage (nominal ${nominalVoltage} V).`,
    motorCurrentRunning: "Running current.",
    motorCurrentStopped: "Motor stopped — no current.",
    motorShaftPower: "Mechanical shaft power output.",
    motorReactiveDesc: "Magnetising reactive demand.",
    motorPfDesc: (pf: number) => `Nominal ${pf} at full load.`,
    motorFreqDesc: (nominalFreq: number) =>
      `Supply frequency (nominal ${nominalFreq} Hz).`,
    motorPfNominal: (pf: number) => `Motor load PF (nominal ${pf}).`,
    motorShaftPowerDelivered: "Real power delivered to shaft.",
    motorMagnitisingReactive: "Magnetising reactive demand.",

    genLiveFreqDesc: "Live output frequency.",
    genNominalFreqDesc: "Nominal standby output frequency.",
    genLiveVoltageDesc: "Live terminal voltage.",
    genNominalVoltageDesc: "Nominal standby terminal voltage.",
    genNominalVoltageDescOneline: "Nominal generator terminal voltage.",
    genLiveCurrentDesc: "Live output current.",
    genOfflineCurrentDesc: "Per-phase current while offline.",
    genEmergencyPowerDesc: "Emergency-source power available to the ATS path.",
    genEmergencyPowerDescOneline:
      "Emergency-source power available to ATS.",
    genZeroWhileOffline: "Zero while offline.",
    genActivePowerRunning: "Active power when running.",
    genReactiveDesc: "Reactive support available.",
    genReactiveDescFull: "Reactive support available during operation.",
    genFuelDesc: "Runtime capacity available.",
    genFuelDescFull: "Available runtime capacity for standby operation.",
    genLiveOutputCurrent: "Live output current.",

    supplyAtMccShort: (nominalVoltage: number) =>
      `Supply at MCC bus (nominal ${nominalVoltage} V).`,
    totalLoadCurrentShort: "Total load current drawn from supply.",
    realPowerConsumed: "Real power consumed by load.",
    totalVAShort: "Total VA demand on the supply.",
    reactiveInductive: "Reactive component — inductive motor load.",
    motorPfNominalShort: (pf: number) => `Motor nominal PF: ${pf}.`,

    generatorsAvailable: (count: number) =>
      `${count} generator(s) available — emergency source ready`,
    utilityActiveStandby: "Utility active — all generators standby",
    electricalOneLineLink: "ELECTRICAL ONE-LINE",

    gridNominal: "GRID NOMINAL",
    gridAnomaly: "GRID ANOMALY",
    generatorActive: "GENERATOR ACTIVE",
    gridSimulation: "GRID SIMULATION",
    powerQualityAnalyzer: "POWER QUALITY ANALYZER",
    dashboard: "DASHBOARD",
    applySimulation: "APPLY SIMULATION",
    randomWalkDesc:
      "Random-walk bounded drift model. Changes apply on next tick.",

    baseVoltage: "Base Voltage (V)",
    baseFrequency: "Base Frequency (Hz)",
    voltageTolerance2: "Voltage Tolerance (%)",
    frequencyBand: "Frequency Band (±Hz)",

    systemDescription: "AUTO DISPENSER SCADA",
    controllerHealthStatus: "24VDC logic healthy / scan executing",
    utility: {
      tag: "UTILITY",
      title: "ELECTRIC GRID",
      provider: "Niagara Peninsula Energy (NPE)",
      status: {
        energized: "ENERGIZED",
        unavailable: "UNAVAILABLE",
      },
      details: {
        button: {
          open: "GRID DETAILS",
          close: "HIDE DETAILS",
        },
        table: {
          parameter: "Parameter",
          unit: "Abbreviation / Unit",
          description: "Description",
        },
        frequency: {
          label: "Frequency",
          desc: "Grid stability indicator.",
        },
        serviceType: {
          label: "Service Type",
          desc: "Utility service configuration.",
        },
        voltageLN: {
          label: "Line-Neutral Voltage",
          desc: "Voltage between phase and neutral.",
        },
        voltageLL: {
          label: "Line-Line Voltage",
          desc: "Voltage between two phases.",
        },
        current: {
          label: "Current",
          desc: "Total current drawn by the installation.",
        },
        activePower: {
          label: "Active Power",
          desc: "Real power consumed by loads.",
        },
        apparentPower: {
          label: "Apparent Power",
          desc: "Total apparent power demand on the grid in volt-amperes.",
        },
        reactivePower: {
          label: "Reactive Power",
          desc: "Reactive component required for some loads.",
        },
        powerFactor: {
          label: "Power Factor",
          desc: "Ratio of active power to apparent power.",
        },
        serviceTypeShort: {
          label: "Service Type",
        },
        voltageLNShort: {
          label: "L-N Voltage",
        },
        voltageLLShort: {
          label: "L-L Voltage",
        },
      },
      value: {
        serviceType: {
          "600y347": "3-phase 4-wire, 600Y/347 V",
          "120208": "3-phase 4-wire, 120/208Y V",
          "120240split": "Single-phase 3-wire, 120/240 V",
        },
        notAvailable: "—",
      },
    },

    utilityName: "Energized Grid",
    motorName: "DISPENSER MTR",
    secondaryServiceCable: "SECONDARY SERVICE CABLE",

    frequency: "Frequency",
    voltage: "Voltage",
    current: "Current",
    activePower: "Active Power",
    apparentPower: "Apparent Power",
    reactivePower: "Reactive Power",
    powerFactor: "Power Factor",
    fuelLevel: "Fuel Level",

    feederCtr: "FEEDER CTR",
    solContactor: "SOL CONTACTOR",
    hopperGate: "HOPPER GATE",
    street: "STREET",
    riserPole: "RISER POLE",
    poleBreaker: "POLE BREAKER",
    padMountTransformer: "PAD-MOUNT TRANSFORMER",
    meter: "METER",
    mainPanel: "MAIN PANEL",
    scadaMonitor: "SCADA MONITOR",
    mainDisconnect: "MAIN DISCONNECT",
    circuitBreaker: "CIRCUIT BREAKER",
    mainPanelGen: "MAIN PANEL GEN",
  },

  fr: {
    uptime: "DISPONIBILITÉ",
    node: "NŒUD",
    time: "HEURE",
    overallStatus: "État général",
    activeAlarms: "Alarmes actives",
    mode: "Mode",
    nextAutoFeed: "Prochain repas auto",

    electricalOneLine: "Schéma unifilaire",
    commandSafetyControls: "Commandes / Sécurité",
    plcStatus: "État PLC-001",
    realTimeProcess: "Valeurs de procédé en temps réel",
    alarmsEvents: "Alarmes / Événements",
    simulationConfig: "Configuration de simulation",
    gridDetails: "Détails réseau",
    generatorUnits: "Groupes électrogènes",

    feedCycleActive: "CYCLE REPAS ACTIF",
    startFeedCycle: "DÉMARRER CYCLE REPAS",
    refillHopper: "REMPLIR TRÉMIE",
    resetEstop: "RÉINITIAL. ARRÊT URG.",
    emergencyStop: "ARRÊT D'URGENCE",
    removeBowl: "RETIRER BOL",
    restoreBowl: "REPLACER BOL",
    emptyBowl: "VIDER BOL",

    controllerHealth: "Santé du contrôleur",
    discreteInputs: "Entrées discrètes (DI)",
    discreteOutputs: "Sorties discrètes (DO)",

    supplyVoltage: "Tension d'alimentation",
    gridFrequency: "Fréquence réseau",
    motorCurrent: "Courant moteur",
    hopperLevel: "Niveau trémie",
    bowlLevelPortion: "Niveau bol / Portion",
    todaysFeeds: "Repas du jour",
    systemMode: "Mode système",
    lastFeedTime: "Dernier repas",
    processSynopsis: "Résumé du procédé",
    openGridSimulation: "OUVRIR SIMULATION RÉSEAU",

    synopsisFault:
      "Distributeur verrouillé suite à une condition de protection. Réinitialisez les entrées de défaut avant le redémarrage.",
    synopsisFeedActive:
      "Moteur et vanne trémie alimentés. Le repas sec est distribué dans le bol.",
    synopsisPowered:
      "Bus électrique sain. API armé en attente de demande de bol / repas programmé.",
    synopsisUnpowered:
      "Sectionneur principal ouvert ou alimentation indisponible. Circuit de commande aval hors tension.",

    alarmActive: "ACTIF",
    alarmEvent: "ÉVÉNEMENT",

    openFullPage: "Ouvrir la page complète",
    exitFullWindow: "Quitter le plein écran",
    fullWindow: "Plein écran",

    notFoundTitle: "404 Page introuvable",
    notFoundDesc: "Avez-vous oublié d'ajouter la page au routeur?",

    inBand: "DANS PLAGE",
    outOfBand: "HORS PLAGE",
    nominal: "Nominal",
    deviation: "Écart",
    band: "Plage (±)",

    parameter: "Paramètre",
    value: "Valeur",
    description: "Description",
    abbreviationUnit: "Abrév. / Unité",

    nominalVoltage: "Tension nominale",
    liveVoltage: "Tension en direct",
    minAllowed: "Min autorisé",
    maxAllowed: "Max autorisé",
    voltageDeviation: "Écart de tension",
    voltageTolerance: "Tolérance de tension",
    nominalFrequency: "Fréquence nominale",
    liveFrequency: "Fréquence en direct",
    freqMin: "Fréq. min",
    freqMax: "Fréq. max",
    freqDeviation: "Écart de fréquence",
    freqBand: "Plage fréq. (±)",
    sampleInterval: "Intervalle d'échantillonnage",
    historySamples: "Échantillons d'historique",
    voltageStatus: "État tension",
    freqStatus: "État fréquence",

    genStateOffline: "HORS LIGNE",
    genStateStarting: "DÉMARRAGE",
    genStateStabilizing: "STABILISATION",
    genStateAvailable: "DISPONIBLE",
    genStateOnBus: "SUR BUS",
    genStateStopping: "ARRÊT",

    phaseCranking: "DÉMARRAGE MOTEUR",
    phaseBuildingVoltage: "MONTÉE EN TENSION",
    phaseReachingRatedSpeed: "ATTEINTE VITESSE NOM.",
    phaseReadyForAts: "PRÊT TRANSFERT ATS",

    fuel: "CARBURANT",
    start: "DÉMARRER",
    stop: "ARRÊTER",
    startingEllipsis: "DÉMARRAGE...",
    stoppingEllipsis: "ARRÊT...",
    liveValuesReflected:
      "Les valeurs en direct sont reflétées dans le schéma unifilaire",
    viewDiagram: "VOIR SCHÉMA →",
    viewInOneLine: "Voir en unifilaire →",

    electricalOneLineHeader: "SCHÉMA UNIFILAIRE",
    gridDetailsButton: "DÉTAILS RÉSEAU",

    atsOnUtility: "ATS SUR RÉSEAU",
    atsOnEmergency: "ATS SUR URGENCE",
    openNoSource: "OUVERT — PAS DE SOURCE",
    energized: "SOUS TENSION",
    unavailable: "INDISPONIBLE",
    deEnergized: "HORS TENSION",
    stopped: "ARRÊTÉ",
    running: "EN MARCHE",
    standby: "VEILLE",
    monitoring: "SURVEILLANCE",
    dead: "HORS TENSION",
    closed: "FERMÉ",
    open: "OUVERT",
    tripped: "DÉCLENCHÉ",
    ok: "OK",
    noFeed: "PAS D'ALIM.",
    openStandby: "OUVERT / VEILLE",
    standbyOffline: "VEILLE / HORS LIGNE",
    campus: "CAMPUS",

    gridStabilityDesc: "Indicateur de stabilité du réseau.",
    supplyVoltageDesc: (nominalVoltage: number) =>
      `Tension d'alimentation au bus MCC (nominal ${nominalVoltage} V).`,
    totalLoadCurrentDesc:
      "Courant de charge total tiré de l'alimentation.",
    realPowerDesc: "Puissance active réellement consommée par la charge.",
    totalVADesc: "Demande totale en volt-ampères sur l'alimentation.",
    reactiveDesc:
      "Composante réactive — essentielle pour l'équilibre du réseau.",
    efficiencyDesc:
      "Ratio d'efficacité énergétique. Charge moteur, nominalement 0,88.",

    motorVoltageDesc: (nominalVoltage: number) =>
      `Tension aux bornes moteur (nominal ${nominalVoltage} V).`,
    motorCurrentRunning: "Courant de charge en marche.",
    motorCurrentStopped: "Moteur arrêté — courant nul.",
    motorShaftPower: "Puissance mécanique délivrée à l'arbre.",
    motorReactiveDesc: "Demande réactive de magnétisation.",
    motorPfDesc: (pf: number) => `Nominal ${pf} à pleine charge.`,
    motorFreqDesc: (nominalFreq: number) =>
      `Fréquence d'alimentation (nominal ${nominalFreq} Hz).`,
    motorPfNominal: (pf: number) => `FP charge moteur (nominal ${pf}).`,
    motorShaftPowerDelivered: "Puissance réelle délivrée à l'arbre.",
    motorMagnitisingReactive: "Demande réactive de magnétisation.",

    genLiveFreqDesc: "Fréquence de sortie en direct.",
    genNominalFreqDesc: "Fréquence de sortie nominale en veille.",
    genLiveVoltageDesc: "Tension aux bornes en direct.",
    genNominalVoltageDesc: "Tension aux bornes nominale en veille.",
    genNominalVoltageDescOneline: "Tension aux bornes nominale du groupe.",
    genLiveCurrentDesc: "Courant de sortie en direct.",
    genOfflineCurrentDesc: "Courant par phase hors ligne.",
    genEmergencyPowerDesc:
      "Puissance source d'urgence disponible pour le chemin ATS.",
    genEmergencyPowerDescOneline:
      "Puissance source d'urgence disponible pour l'ATS.",
    genZeroWhileOffline: "Nul hors ligne.",
    genActivePowerRunning: "Puissance active en marche.",
    genReactiveDesc: "Support réactif disponible.",
    genReactiveDescFull:
      "Support réactif disponible pendant le fonctionnement.",
    genFuelDesc: "Capacité de fonctionnement disponible.",
    genFuelDescFull:
      "Capacité de fonctionnement disponible en mode veille.",
    genLiveOutputCurrent: "Courant de sortie en direct.",

    supplyAtMccShort: (nominalVoltage: number) =>
      `Alimentation au bus MCC (nominal ${nominalVoltage} V).`,
    totalLoadCurrentShort:
      "Courant de charge total tiré de l'alimentation.",
    realPowerConsumed: "Puissance active consommée par la charge.",
    totalVAShort: "Demande totale VA sur l'alimentation.",
    reactiveInductive:
      "Composante réactive — charge moteur inductif.",
    motorPfNominalShort: (pf: number) => `FP nominal moteur : ${pf}.`,

    generatorsAvailable: (count: number) =>
      `${count} groupe(s) disponible(s) — source d'urgence prête`,
    utilityActiveStandby: "Réseau actif — tous les groupes en veille",
    electricalOneLineLink: "SCHÉMA UNIFILAIRE",

    gridNominal: "RÉSEAU NOMINAL",
    gridAnomaly: "ANOMALIE RÉSEAU",
    generatorActive: "GROUPE ACTIF",
    gridSimulation: "SIMULATION RÉSEAU",
    powerQualityAnalyzer: "ANALYSEUR QUALITÉ ÉNERGIE",
    dashboard: "TABLEAU DE BORD",
    applySimulation: "APPLIQUER SIMULATION",
    randomWalkDesc:
      "Modèle de dérive aléatoire bornée. Les modifications s'appliquent au prochain cycle.",

    baseVoltage: "Tension de base (V)",
    baseFrequency: "Fréquence de base (Hz)",
    voltageTolerance2: "Tolérance tension (%)",
    frequencyBand: "Plage fréquence (±Hz)",

    systemDescription: "SCADA DISTRIBUTEUR AUTO",
    controllerHealthStatus: "Logique 24VCC saine / scan en cours",
    utility: {
      tag: "RÉSEAU",
      title: "RÉSEAU ÉLECTRIQUE",
      provider: "Niagara Peninsula Energy (NPE)",
      status: {
        energized: "SOUS TENSION",
        unavailable: "INDISPONIBLE",
      },
      details: {
        button: {
          open: "DÉTAILS RÉSEAU",
          close: "MASQUER LES DÉTAILS",
        },
        table: {
          parameter: "Paramètre",
          unit: "Abrév. / Unité",
          description: "Description",
        },
        frequency: {
          label: "Fréquence",
          desc: "Indicateur de stabilité du réseau.",
        },
        serviceType: {
          label: "Type de raccordement",
          desc: "Configuration du service d’alimentation du réseau.",
        },
        voltageLN: {
          label: "Tension phase-neutre",
          desc: "Tension mesurée entre une phase et le neutre.",
        },
        voltageLL: {
          label: "Tension phase-phase",
          desc: "Tension mesurée entre deux phases.",
        },
        current: {
          label: "Courant",
          desc: "Courant total appelé par l’installation.",
        },
        activePower: {
          label: "Puissance active",
          desc: "Puissance réellement consommée par les charges.",
        },
        apparentPower: {
          label: "Puissance apparente",
          desc: "Puissance totale demandée au réseau en voltampères.",
        },
        reactivePower: {
          label: "Puissance réactive",
          desc: "Composante réactive nécessaire au fonctionnement de certaines charges.",
        },
        powerFactor: {
          label: "Facteur de puissance",
          desc: "Rapport entre la puissance active et la puissance apparente.",
        },
        serviceTypeShort: {
          label: "Type de service",
        },
        voltageLNShort: {
          label: "Tension L-N",
        },
        voltageLLShort: {
          label: "Tension L-L",
        },
      },
      value: {
        serviceType: {
          "600y347": "Triphasé 4 conducteurs, 600Y/347 V",
          "120208": "Triphasé 4 conducteurs, 120/208Y V",
          "120240split": "Monophasé 3 conducteurs, 120/240 V",
        },
        notAvailable: "—",
      },
    },

    utilityName: "Réseau électrique",
    motorName: "MTR DISTRIBUTEUR",
    secondaryServiceCable: "CÂBLE SERVICE SECONDAIRE",

    frequency: "Fréquence",
    voltage: "Tension",
    current: "Courant",
    activePower: "Puissance active",
    apparentPower: "Puissance apparente",
    reactivePower: "Puissance réactive",
    powerFactor: "Facteur de puissance",
    fuelLevel: "Niveau carburant",

    feederCtr: "CTR DISTRIBUTION",
    solContactor: "CONTACT. SOL.",
    hopperGate: "VANNE TRÉMIE",
    street: "RUE",
    riserPole: "MONTÉE POTEAU",
    poleBreaker: "DISJ. POTEAU",
    padMountTransformer: "TRANSFO. SOCLE",
    meter: "COMPTEUR",
    mainPanel: "TABLEAU PRINCIPAL",
    scadaMonitor: "MONITEUR SCADA",
    mainDisconnect: "SECT. PRINCIPAL",
    circuitBreaker: "DISJONCTEUR",
    mainPanelGen: "TABLEAU PRINC. GEN",
  },
} as const;

export type Translations = (typeof translations)[Locale];
