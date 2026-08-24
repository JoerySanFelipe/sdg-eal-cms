// admin/js/baseline-registry.js
/**
 * Domain Baseline Factory & Fixture Registry
 * Pure Domain Data Models for UCU SDG Platform Baseline State
 */

import { SDG_METADATA, INDICATOR_PILLARS } from './shared-utils.js';

export { SDG_METADATA, INDICATOR_PILLARS };

/**
 * Baseline Static Data Factory
 * @param {string|object} section - Section identifier or object { type, id, year }
 * @param {string} [paramId=null] - Optional ID if section is a string
 * @param {string} [paramYear='2025'] - Optional reporting year
 * @returns {object} Baseline schema-compliant draft data
 */
export function getBaselineData(section, paramId = null, paramYear = '2025') {
  let type, id, year;
  if (typeof section === 'string') {
    type = section;
    id = paramId;
    year = paramYear || '2025';
  } else if (section && typeof section === 'object') {
    type = section.type;
    id = section.id;
    year = section.year || '2025';
  } else {
    type = 'home';
    id = 'main';
    year = '2025';
  }

  // 1. SDG Narrative Reports (1-17)
  if (type === 'sdg') {
    const meta = SDG_METADATA[id] || { title: `SDG ${id}`, subtitle: "Sustainable Development Goal", color: "#394a8a" };
    const defaultMetrics = [
      { value: "1,920", label: "Beneficiaries Reached", theme: "navy", icon: "users" },
      { value: "45", label: "Active Programs", theme: "red", icon: "target" },
      { value: "15", label: "Research Publications", theme: "navy", icon: "book-open" }
    ];
    const defaultLead = `Sustainable Development Goal ${id} (${meta.title}) drives institutional action at Urdaneta City University. Through innovative research, strategic partnerships, and community-led initiatives, UCU actively contributes to regional and global sustainable development targets.`;

    return {
      reportYear: year,
      heroHeader: {
        goalName: `Sustainable Development Goal ${id}`,
        goalTitle: meta.title,
        subtitle: meta.subtitle,
        sdgNum: parseInt(id, 10) || 1,
        heroBackground: `../images/sdg-banner/sdg${id}.jpg`,
        heroIconImage: `../images/sdg/sdg${id}.png`,
        themeColor: meta.color
      },
      narrative: [
        {
          type: "metric_cards",
          metrics: defaultMetrics
        },
        {
          type: "paragraph",
          content: defaultLead
        }
      ],
      impactDrawers: [
        {
          drawerTitle: "Institutional Framework & Action Plans",
          isOpen: true,
          eventId: "kalahi-cidss",
          contents: [
            {
              type: "paragraph",
              content: `Urdaneta City University (UCU) recognizes that achieving ${meta.title} requires a rigorous, evidence-based approach that integrates campus-wide policies with community engagement.`
            },
            {
              type: "data_viz",
              vizType: "progress",
              title: "Strategic Impact Performance",
              subtitle: "Target vs Actual Outcome",
              payload: [
                { label: "Community Participation", percentage: 90, barColorClass: "bg-ucu-blue-dark" },
                { label: "Institutional Alignment", percentage: 85, barColorClass: "bg-ucu-red" },
                { label: "Sustainable Impact", percentage: 80, barColorClass: "bg-ucu-yellow" }
              ]
            }
          ]
        },
        {
          drawerTitle: "Community Extension & Direct Interventions",
          isOpen: false,
          eventId: "",
          contents: [
            {
              type: "paragraph",
              content: `Through specialized extension programs, UCU faculty and students engage directly with local government units and grassroots communities to deliver measurable impact.`
            }
          ]
        }
      ],
      // Backward-compatible mirror properties
      sdgNum: id,
      year: year,
      title: meta.title,
      subtitle: meta.subtitle,
      colorHex: meta.color,
      heroBgImage: `../images/sdg-banner/sdg${id}.jpg`,
      heroIconImage: `../images/sdg/sdg${id}.png`,
      metrics: defaultMetrics,
      executiveSummary: defaultLead
    };
  }

  // 2. Homepage
  if (type === 'home') {
    return {
      heroEyebrow: "Urdaneta City University",
      heroHeadline: "Global Standards.",
      heroHeadlineHighlight: "Local Impact.",
      heroSubtitle: "Driving institutional excellence through strategic international linkages, high-impact research, and an unwavering commitment to the UN Sustainable Development Goals.",
      heroCta1Text: "Explore Partnerships",
      heroCta1Link: "partnership.html",
      heroCta2Text: "View SDG Reports",
      heroCta2Link: "sdg-reports/2025.html",
      sliderImages: [
        "../images/home-sliders/1.png",
        "../images/home-sliders/2.png",
        "../images/home-sliders/3.png"
      ],
      commitmentEyebrow: "Our Commitment",
      commitmentTitle: "Global Standards, Local Impact",
      commitmentCtaText: "Read More",
      commitmentCtaLink: "announcement.html",
      introParagraph1: "Urdaneta City University stands at the intersection of international academic excellence and localized sustainable development. We are committed to dismantling geographical boundaries through strategic global linkages, robust research collaboration, and an unwavering dedication to the United Nations Agenda 2030.",
      introParagraph2: "By forging active partnerships across multiple continents, we subject our academic frameworks to rigorous global evaluations. This international exposure translates into cutting-edge pedagogy and facilities, empowering our External Office to drive true socio-economic mobility through evidence-based community outreach.",
      headlineSliders: [
        "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
        "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
        "../images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png"
      ],
      metricsEyebrow: "Institutional Impact",
      metricsTitle: "Strength in Numbers",
      metrics: [
        { label: "Total Events", value: "48", theme: "white", icon: "calendar" },
        { label: "Research & Pubs", value: "124", theme: "white", icon: "book-open" },
        { label: "Univ Rankings", value: "6", theme: "navy", icon: "award" },
        { label: "Local Partners", value: "85", theme: "white", icon: "map-pin" },
        { label: "Global Partners", value: "24", theme: "white", icon: "globe" },
        { label: "Active MOUs", value: "42", theme: "red", icon: "handshake" }
      ],
      allianceTitle: "Forge a Strategic Alliance",
      allianceDescription: "Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.",
      partnershipFormUrl: "https://forms.google.com/your-form-id-here",
      emailExternal: "externalaffairsandlinkages@ucu.edu.ph",
      emailOfficial: "officeofthepresident@ucu.edu.ph"
    };
  }

  // 3. Institutional Rankings
  if (type === 'rankings') {
    const defaultRankings = (typeof window !== 'undefined' && Array.isArray(window.UCU_RANKINGS))
      ? JSON.parse(JSON.stringify(window.UCU_RANKINGS))
      : [
          {
            org: "AppliedHE",
            year: "2026",
            mainRankLabel: "Overall Asia Ranking",
            mainRank: "241-260",
            category: "All Asia",
            badgeClass: "bg-[#f26422] text-white",
            crownBadgeClass: "bg-[#f26422] text-white",
            shortDescription: "Top tier recognition among Public and Local Universities within the ASEAN Region and the Philippines.",
            publicationUrl: "",
            publicationDate: "March 15, 2026",
            logo: "images/rankings-logo/applied-he.png",
            metrics: [
              { label: "Public Univ. ASEAN Region", value: "#107", subtext: "", color: "#fbef4b" },
              { label: "Public Univ. Philippines", value: "#17", subtext: "", color: "#fbef4b" },
              { label: "Public Univ. Region 1", value: "#2", subtext: "", color: "#fbef4b" },
              { label: "Local Univ. & College Region 1", value: "#1", subtext: "", color: "#c43643" }
            ]
          },
          {
            org: "WURI",
            year: "2025",
            mainRankLabel: "World University Ranking",
            mainRank: "#44",
            category: "World Rankings",
            badgeClass: "bg-[#0f4088] text-white",
            crownBadgeClass: "bg-[#0f4088] text-white",
            shortDescription: "Recognized globally for real-world impact and innovative approaches to education and industrial application.",
            publicationUrl: "",
            publicationDate: "June 12, 2025",
            logo: "images/rankings-logo/wuri.png",
            metrics: [
              { label: "A3 Industrial Application", value: "#1", subtext: '"Smart Aquaculture: Advancing Regional Fisheries Sustainability Through Innovative Monitoring Solutions"', color: "#394a8a" },
              { label: "A8 SDG-Based Responses", value: "#2", subtext: '"AgriTech for All: Empowering Farmers with Mobile Solutions for Disease Detection and Precision Farming"', color: "#394a8a" },
              { label: "A2 Student Mobility & Openness", value: "#4", subtext: '"Empowering Communities, Preserving Culture: A Global Journey into Sustainable Tourism"', color: "#394a8a" }
            ]
          },
          {
            org: "UI GreenMetric",
            year: "2025",
            mainRankLabel: "World Rankings",
            mainRank: "#362",
            category: "World Rankings",
            badgeClass: "bg-[#00993d] text-white",
            crownBadgeClass: "bg-[#00993d] text-white",
            shortDescription: "Ranked #1 Local University in the Philippines for excellence in environmental sustainability and green campus management.",
            publicationUrl: "",
            publicationDate: "December 5, 2025",
            logo: "images/rankings-logo/ui-green.png",
            metrics: [
              { label: "LUC in the Philippines", value: "#1", subtext: "", color: "#00993d" },
              { label: "LUC in Northern Luzon", value: "#1", subtext: "", color: "#00993d" },
              { label: "Province of Pangasinan", value: "#1", subtext: "", color: "#00993d" },
              { label: "Region 1", value: "#3", subtext: "", color: "#00993d" },
              { label: "Philippines", value: "#9", subtext: "", color: "#00993d" },
              { label: "Asia", value: "#203", subtext: "", color: "#00993d" }
            ]
          },
          {
            org: "THE Impact",
            year: "2025",
            mainRankLabel: "Global Impact Rank",
            mainRank: "1501+",
            category: "Impact Rankings",
            badgeClass: "bg-[#201f1f] text-white",
            crownBadgeClass: "bg-[#201f1f] text-white",
            shortDescription: "Evaluated against the United Nations' Sustainable Development Goals (SDGs) for global institutional impact.",
            publicationUrl: "",
            publicationDate: "June 20, 2025",
            logo: "images/rankings-logo/the-impact.png",
            metrics: [
              { label: "SDG 1: No Poverty", value: "Global 401–600", subtext: "PH #6 | Region 1 #2", color: "#E5243B" },
              { label: "SDG 3: Good Health", value: "Global 1001–1500", subtext: "PH #6 | Region 1 #3", color: "#4C9F38" },
              { label: "SDG 4: Quality Ed.", value: "Global 1001–1500", subtext: "PH #5 | Region 1 #3", color: "#C5192D" },
              { label: "SDG 5: Gender Eq.", value: "Global 601–800", subtext: "PH #6 | Region 1 #3", color: "#FF3A21" },
              { label: "SDG 16: Peace & Justice", value: "Global 801–1000", subtext: "PH #6 | Region 1 #3", color: "#00689D" },
              { label: "SDG 17: Partnerships", value: "Global 1501+", subtext: "PH #7 | Region 1 #4", color: "#19486A" }
            ]
          }
        ];

    return {
      heroEyebrow: "A Network of Excellence",
      heroHeadline: "Connecting UCU",
      heroHighlight: "Globally",
      heroDescription: "Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.",
      standingTitle: "Current Global Standing",
      trajectoryEyebrow: "Institutional Trajectory",
      trajectoryTitle: "Historical Performance",
      terminusStatement: `"We will continue our commitment to relentless innovation and real-world impact, ensuring the little giant UCU rises to meet the titans on the global stage."`,
      rankingsList: defaultRankings
    };
  }

  // 4. Impact & Events
  if (type === 'events' || type === 'impact') {
    return {
      heroEyebrow: "News & Documentation",
      heroHeadline: "Impact & Events",
      heroHighlight: "2025.",
      heroDescription: "Documenting UCU's institutional milestones, community engagements, and sustainable development initiatives.",
      metrics: [
        { value: "3", label: "Upcoming (May)", theme: "white" },
        { metricId: "totalEvents", value: "48", label: "Total Engagements", theme: "white" },
        { value: "5,000+", label: "Community Reached", theme: "white" },
        { value: "17", label: "SDGs Addressed", theme: "white" }
      ],
      eventsList: [
        {
          id: "kalahi-cidss",
          title: "DSWD's Kalahi-CIDSS Cash-for-Work Program",
          date: "March 15-22, 2025",
          desc: "Urdaneta City University strengthens community engagement through support for DSWD's sustainable livelihood and infrastructure programs in vulnerable sectors.",
          img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic6.png",
          src: "events/2025/kalahi-cidss.html",
          relatedSdgs: [1, 8, 10],
          isFeatured: true,
          isHighlights: true
        },
        {
          id: "smart-campus-launch",
          title: "UCU Unveils Phase 1 of the Smart Eco-Campus Initiative",
          date: "February 10, 2025",
          desc: "The university officially transitions to a 30% solar-powered grid, marking a massive milestone in our UI GreenMetric institutional commitments.",
          img: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=800&auto=format&fit=crop",
          src: "",
          relatedSdgs: [7, 9, 11, 13],
          isFeatured: true,
          isHighlights: true
        },
        {
          id: "health-symposium",
          title: "International Symposium on Rural Health Diagnostics",
          date: "January 28, 2025",
          desc: "Global experts gather at the UCU Main Hall to discuss digital interventions for remote maternal health.",
          img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop",
          src: "",
          relatedSdgs: [3, 17],
          isFeatured: true,
          isHighlights: false
        },
        {
          id: "gender-equality-forum",
          title: "Women in STEM: The 2025 Leadership Forum",
          date: "January 15, 2025",
          desc: "Celebrating our female engineering and IT students leading innovations in sustainable architecture.",
          img: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=400&auto=format&fit=crop",
          src: "",
          relatedSdgs: [4, 5, 10],
          isFeatured: true,
          isHighlights: false
        }
      ]
    };
  }

  // 5. Academic Research
  if (type === 'research') {
    return {
      heroEyebrow: "Institutional Archive",
      heroHeadline: "SDG Research",
      heroHighlight: "Archive.",
      heroDescription: "An open-access archive of Urdaneta City University's academic contributions. Explore peer-reviewed publications, institutional studies, and localized research directly aligned with the United Nations' Sustainable Development Goals.",
      researchList: [
        {
          title: "Impact of Digital Health Interventions on Rural Education Outcomes",
          authors: "Dr. Maria Santos, et al.",
          date: "Oct 2025",
          abstract: "This study evaluates the intersection of adolescent health and academic performance in Northern Luzon. By deploying targeted digital health tracking within the localized curriculum, the research demonstrates a significant correlation between well-being interventions and improved scholastic retention rates among marginalized communities.",
          sdgs: [3, 4],
          keywords: ["Adolescent Health", "Digital Health", "Scholastic Retention"],
          pdfLink: "../documents/santos-et-al.pdf"
        },
        {
          title: "Economic Efficacy of Cash-for-Work Programs in Pangasinan",
          authors: "Prof. Juan dela Cruz",
          date: "Mar 2025",
          abstract: "An analysis of the DSWD's KALAHI-CIDSS initiative. This paper examines the short-term economic stabilization provided by cash-for-work frameworks in highly vulnerable sectors of Urdaneta City, establishing metrics for sustainable inclusive growth and the reduction of regional income inequalities.",
          sdgs: [1, 8, 10],
          keywords: ["Cash-for-Work", "Inclusive Growth", "Economic Efficacy"],
          pdfLink: "#"
        },
        {
          title: "Climate Resilience of Indigenous Flora in Northern Agno Basin",
          authors: "College of Agriculture Research Team",
          date: "Nov 2024",
          abstract: "Investigating the adaptive mechanisms of local plant species against increasingly severe weather anomalies. The research outlines actionable strategies for preserving terrestrial ecosystems and reinforcing agricultural security amidst shifting climate patterns in Region I.",
          sdgs: [13, 15],
          keywords: ["Climate Resilience", "Indigenous Flora", "Agno Basin"],
          pdfLink: "#"
        }
      ]
    };
  }

  // 6. Strategic Partnerships
  if (type === 'partnership' || type === 'partnerships') {
    const defaultPartners = (typeof window !== 'undefined' && window.UCU_PARTNERS) ? window.UCU_PARTNERS : [
      { name: "Adventist University of the Philippines", category: "local-academic", logoSrc: "./images/local-partners/Adventist-University-of-the-Philippines.png", url: "" },
      { name: "Ateneo De Davao University", category: "local-academic", logoSrc: "./images/local-partners/ateneo-de-davao-university.png", url: "" },
      { name: "Benguet State University", category: "local-academic", logoSrc: "./images/local-partners/BSU.png", url: "" },
      { name: "Beyond Books Publication", category: "local-industry", logoSrc: "./images/local-partners/Beyond-Books-Publication.png", url: "" },
      { name: "Center for Pangasinan Studies", category: "local-industry", logoSrc: "./images/local-partners/CPS.png", url: "" },
      { name: "Philippine Red Cross", category: "local-industry", logoSrc: "./images/local-partners/Redcross.png", url: "" },
      { name: "Abdullah Gul University", category: "international-academic", logoSrc: "./images/international-partners/abdullah-gul-university.png", url: "" },
      { name: "American University of Sovereign Nations", category: "international-academic", logoSrc: "./images/international-partners/ausovereignnations.png", url: "https://ausovereignnations.org/" },
      { name: "Deggendorf Institute of Technology", category: "international-academic", logoSrc: "./images/international-partners/dit-logo-grau.png", url: "" },
      { name: "Global Peace Foundation", category: "international-industry", logoSrc: "./images/international-partners/Global-Peace.png", url: "" },
      { name: "Sustainable Development Solutions Network", category: "membership", logoSrc: "./images/membership/SDSN.png", url: "" },
      { name: "United Nations Academic Impact", category: "membership", logoSrc: "./images/membership/UN-AcademicImpact.png", url: "" }
    ];

    return {
      heroEyebrow: "Trusted Connections. Global Vision.",
      heroHeadline: "UCU Beyond",
      heroHighlight: "Borders",
      heroDescription: "Creating lasting partnerships that empower education, elevate standards, and connect Urdaneta City University to opportunities across the world.",
      partnersList: defaultPartners,
      countries: [
        "Philippines", "Turkey", "Bangladesh", "Indonesia", "Japan", "Oman", "South Korea", 
        "Thailand", "Taiwan", "Vietnam", "Malaysia", "China", 
        "Bosnia and Herzegovina", "United Kingdom", "Switzerland", "Poland", "Germany", 
        "USA", "Canada", "India", "France", "Spain"
      ],
      allianceTitle: "Forge a Strategic Alliance",
      allianceDescription: "Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.",
      partnershipFormUrl: "https://forms.google.com/your-form-id-here",
      emailExternal: "externalaffairsandlinkages@ucu.edu.ph",
      emailOfficial: "officeofthepresident@ucu.edu.ph"
    };
  }

  // 7. Smart Eco Campus & UI GreenMetric
  if (type === 'smart_eco' || type === 'smarteco') {
    return {
      heroEyebrow: "Innovation Powered by Sustainability",
      heroHeadline: "Smart Eco",
      heroHighlight: "Campus",
      heroDescription: "Creating a campus where innovation, sustainability, and responsible growth work together to elevate institutional performance and environmental impact.",
      recognitionEyebrow: "Global Recognition",
      recognitionTitle: "An Academic Milestone",
      introParagraph1: "The UI GreenMetric World University Rankings evaluates green campuses and environmental sustainability across 39 indicators in 6 criteria.",
      introParagraph2: "As a first try for UCU in this global ranking, it is an academic milestone worthy of celebration.",
      introParagraph3: "Congratulations, UCUians! Mabuhay ang Urdaneta City University!",
      awardImages: [
        "./images/smart-eco-assets/ui-gm2.jpg",
        "./images/smart-eco-assets/ui-gm.jpg"
      ],
      standingHeader: "Out of 1,477 universities worldwide in 2025, WE ARE:",
      milestones: [
        { rank: "#1", label: "Local Universities & Colleges (LUC) in the Philippines", color: "#fbef4b", theme: "blue", isFeatured: true },
        { rank: "#1", label: "HEI in Water Management Category", color: "#c43643", theme: "white" },
        { rank: "#1", label: "in the Province of Pangasinan", color: "#c43643", theme: "white" },
        { rank: "#3", label: "in Region 1", color: "#c43643", theme: "white" },
        { rank: "#8", label: "in the Entire Philippines", color: "#c43643", theme: "white" },
        { rank: "#189", label: "in Asia", color: "#c43643", theme: "white" },
        { rank: "#361", label: "IN THE WORLD", color: "#ffffff", theme: "red", isWorld: true }
      ],
      sustainabilityIndicators: [
        { num: "01", title: "Setting and Infrastructure", link: "indicators/infrastructure.html", id: "infrastructure" },
        { num: "02", title: "Energy and Climate Change", link: "indicators/energy.html", id: "energy" },
        { num: "03", title: "Waste", link: "indicators/waste.html", id: "waste" },
        { num: "04", title: "Water", link: "indicators/water.html", id: "water" },
        { num: "05", title: "Transportation", link: "indicators/transportation.html", id: "transportation" },
        { num: "06", title: "Education and Research", link: "indicators/education.html", id: "education" },
        { num: "07", title: "Digitalization", link: "indicators/digitalization.html", id: "digitalization" }
      ],
      concludingParagraph: "These seven sustainability indicators form the strategic framework of Urdaneta City University’s Smart Eco Campus initiative. By aggressively aligning our institutional metrics with global environmental standards—such as the UI GreenMetric framework—we do more than cultivate a green learning environment. We forge high-impact linkages with international stakeholders, driving collaborative research and scalable sustainable practices that elevate our graduates to global competitiveness."
    };
  }

  // 8. Indicators & Evidence Registry
  if (type === 'indicator') {
    const pillar = INDICATOR_PILLARS.find(p => p.id === id) || { id, title: "Setting & Infrastructure", num: "01" };
    
    const defaultManifests = {
      infrastructure: {
        metrics: [
          { value: "39", label: "Campus Sites", theme: "navy", evidenceId: "1_3" },
          { value: "35,544", label: "Campus Area (m²)", theme: "red", evidenceId: "1_5" },
          { value: "61.1%", label: "Open Space Ratio", theme: "navy", evidenceId: "1_8" }
        ],
        narrative: `Urdaneta City University (UCU) demonstrates a progressive campus design that balances modern facilities with extensive natural landscapes. Spanning a total area of 35,544 square meters (approximately 3.55 hectares), the university grounds are carefully zoned to support academic excellence, community interaction, and ecological preservation. A major highlight of the campus setting is its exceptional allocation of open spaces, which cover 21,731 square meters, yielding an open space ratio of 61.1% of the entire campus.`,
        evidenceList: [
          { id: "1_3", title: "1.3 Number of Campus Sites", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_3.html", relatedSdgs: [4, 9, 11] },
          { id: "1_4", title: "1.4 Main Campus Setting", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_4.html", relatedSdgs: [4, 11, 15] },
          { id: "1_5", title: "1.5 Total Main Campus Area", badge: "Setting and Infrastructure", src: "../evidence/infrastructure/1_5.html", relatedSdgs: [4, 11, 15] }
        ]
      },
      energy: {
        metrics: [
          { value: "91%", label: "Energy-Efficient Appliances", theme: "navy", evidenceId: "2_1" },
          { value: "571,950", label: "kWh Electricity Per Year", theme: "red", evidenceId: "2_6" },
          { value: "503", label: "Metric Tons CO₂ (2024)", theme: "navy", evidenceId: "2_11" }
        ],
        narrative: `Urdaneta City University is actively pursuing energy efficiency and climate-responsible operations across its campus. A total of 91% of campus appliances are classified as energy-efficient.`,
        evidenceList: [
          { id: "2_1", title: "2.1 Energy Efficient Appliances Usage", badge: "Energy and Climate Change", src: "../evidence/energy/2_1.html", relatedSdgs: [7, 12, 13] },
          { id: "2_3", title: "2.3 Smart Building Implementation", badge: "Energy and Climate Change", src: "../evidence/energy/2_3.html", relatedSdgs: [7, 9, 11, 13] }
        ]
      }
    };

    const pillarData = defaultManifests[id] || defaultManifests.infrastructure;
    const thumbImage = pillar.img || `images/smart-eco-assets/${id}.jpg`;
    const defaultIcon = `images/indicator-icons/${id}.png`;

    const metricsCard = (pillarData.metrics || []).map(m => ({
      value: m.value || '',
      title: m.title || m.label || '',
      url: m.url || m.evidenceId || '',
      theme: m.theme || 'navy',
      label: m.title || m.label || '',
      evidenceId: m.url || m.evidenceId || ''
    }));

    const evidences = (pillarData.evidenceList || []).map(ev => {
      const underscoreId = ev.id ? ev.id.replace(/\./g, '_') : '';
      return {
        codeID: ev.id ? ev.id.replace(/_/g, '.') : '',
        referenceId: pillar.num,
        title: ev.title || '',
        badge: ev.badge || pillar.title,
        relatedSdgs: Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs : [],
        src: ev.src || `../evidence/${id}/${underscoreId}.html`,
        thumb_evidence: ev.thumb_evidence || ev.img || defaultIcon,
        year: "2025",
        id: ev.id,
        img: ev.thumb_evidence || ev.img || defaultIcon
      };
    });

    return {
      indicatorId: id,
      indicatorNum: pillar.num,
      indicatorTitle: pillar.title,
      thumb_image: thumbImage,
      thumb_evidence: defaultIcon,
      narrative: pillarData.narrative,
      metricsCard: JSON.parse(JSON.stringify(metricsCard)),
      evidences: JSON.parse(JSON.stringify(evidences)),
      // Legacy Aliases
      pillarId: id,
      pillarTitle: pillar.title,
      activeNum: pillar.num,
      thumbnailImg: thumbImage,
      evidence_thumb: defaultIcon,
      metrics: JSON.parse(JSON.stringify(metricsCard)),
      evidenceList: JSON.parse(JSON.stringify(evidences))
    };
  }

  // 9. SDG Dashboard Page
  if (type === 'sdg_dashboard') {
    return {
      heroEyebrow: "Local Action. Global Impact.",
      heroHeadline: "SDG Reports",
      heroHighlight: "2025",
      heroDescription: "Documenting Urdaneta City University’s measurable contributions to the United Nations Sustainable Development Goals through education, research, partnerships, and community-driven initiatives in 2025.",
      metrics: [
        { metricId: "sdgTargets", value: "169", label: "Targets", theme: "white" },
        { metricId: "totalEvents", value: "48", label: "Events", theme: "white" },
        { metricId: "totalResearch", value: "124", label: "Research", theme: "white" }
      ],
      sdgCards: [
        { goalNum: "1", title: "No Poverty", subtitle: "End poverty in all its forms everywhere.", color: "#E5243B", bgImg: "../images/sdg/bg/1.png", logoImg: "../images/sdg/sdg1.png" },
        { goalNum: "2", title: "Zero Hunger", subtitle: "End hunger, achieve food security and improved nutrition.", color: "#DDA63A", bgImg: "../images/sdg/bg/2.png", logoImg: "../images/sdg/sdg2.png" },
        { goalNum: "3", title: "Good Health and Well-being", subtitle: "Ensure healthy lives and promote well-being for all.", color: "#4C9F38", bgImg: "../images/sdg/bg/3.png", logoImg: "../images/sdg/sdg3.png" },
        { goalNum: "4", title: "Quality Education", subtitle: "Ensure inclusive and equitable quality education.", color: "#C5192D", bgImg: "../images/sdg/bg/4.png", logoImg: "../images/sdg/sdg4.png" },
        { goalNum: "5", title: "Gender Equality", subtitle: "Achieve gender equality and empower all women and girls.", color: "#FF3A21", bgImg: "../images/sdg/bg/5.png", logoImg: "../images/sdg/sdg5.png" },
        { goalNum: "6", title: "Clean Water and Sanitation", subtitle: "Ensure availability and sustainable management of water.", color: "#26BDE2", bgImg: "../images/sdg/bg/6.png", logoImg: "../images/sdg/sdg6.png" },
        { goalNum: "7", title: "Affordable and Clean Energy", subtitle: "Ensure access to affordable, reliable, sustainable energy.", color: "#FCC30B", bgImg: "../images/sdg/bg/7.png", logoImg: "../images/sdg/sdg7.png" },
        { goalNum: "8", title: "Decent Work and Economic Growth", subtitle: "Promote sustained, inclusive and sustainable economic growth.", color: "#A21942", bgImg: "../images/sdg/bg/8.png", logoImg: "../images/sdg/sdg8.png" },
        { goalNum: "9", title: "Industry, Innovation and Infrastructure", subtitle: "Build resilient infrastructure, promote inclusive industrialization.", color: "#FD6925", bgImg: "../images/sdg/bg/9.png", logoImg: "../images/sdg/sdg9.png" },
        { goalNum: "10", title: "Reduced Inequalities", subtitle: "Reduce inequality within and among countries.", color: "#DD1367", bgImg: "../images/sdg/bg/10.png", logoImg: "../images/sdg/sdg10.png" },
        { goalNum: "11", title: "Sustainable Cities and Communities", subtitle: "Make cities and human settlements inclusive, safe, resilient.", color: "#FD9D24", bgImg: "../images/sdg/bg/11.png", logoImg: "../images/sdg/sdg11.png" },
        { goalNum: "12", title: "Responsible Consumption and Production", subtitle: "Ensure sustainable consumption and production patterns.", color: "#BF8B2E", bgImg: "../images/sdg/bg/12.png", logoImg: "../images/sdg/sdg12.png" },
        { goalNum: "13", title: "Climate Action", subtitle: "Take urgent action to combat climate change and its impacts.", color: "#3F7E44", bgImg: "../images/sdg/bg/13.png", logoImg: "../images/sdg/sdg13.png" },
        { goalNum: "14", title: "Life Below Water", subtitle: "Conserve and sustainably use the oceans, seas and marine resources.", color: "#0A97D9", bgImg: "../images/sdg/bg/14.png", logoImg: "../images/sdg/sdg14.png" },
        { goalNum: "15", title: "Life on Land", subtitle: "Protect, restore and promote sustainable use of terrestrial ecosystems.", color: "#56C02B", bgImg: "../images/sdg/bg/15.png", logoImg: "../images/sdg/sdg15.png" },
        { goalNum: "16", title: "Peace, Justice and Strong Institutions", subtitle: "Promote peaceful and inclusive societies for sustainable development.", color: "#00689D", bgImg: "../images/sdg/bg/16.png", logoImg: "../images/sdg/sdg16.png" },
        { goalNum: "17", title: "Partnerships for the Goals", subtitle: "Strengthen the means of implementation and revitalize the global partnership.", color: "#19486A", bgImg: "../images/sdg/bg/17.png", logoImg: "../images/sdg/sdg17.jpg" }
      ]
    };
  }

  // 10. Announcements
  if (type === 'announcement' || type === 'announcements') {
    return {
      announcementsList: [
        {
          id: "ann-0",
          category: "Academic Linkages",
          title: "Strength of Urdaneta City University Research & Global Linkages Endorsed by 2025 Milestones",
          desc: "Urdaneta City University welcomes the latest results of institutional research evaluations and international linkages, demonstrating the university’s unwavering delivery of high-quality, high-impact sustainable development programs and global academic alliances.",
          img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
          src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
          date: "May 20, 2025",
          badge: "Featured",
          isFeatured: true,
          relatedSdgs: [4, 9, 17],
          blocks: [
            {
              type: "paragraph",
              content: "Urdaneta City University welcomes the latest results of institutional research evaluations and international linkages, demonstrating the university’s unwavering delivery of high-quality, high-impact sustainable development programs and global academic alliances."
            },
            {
              type: "heading",
              level: "h2",
              title: "Expanding Global Institutional Collaborations"
            },
            {
              type: "paragraph",
              content: "Through strategic engagements across the ASEAN region and active participation in international university ranking frameworks, UCU continues to cultivate academic excellence, faculty mobility, and world-class sustainable innovation."
            },
            {
              type: "image",
              src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
              caption: "Urdaneta City University leadership celebrating key institutional ranking milestones."
            }
          ]
        },
        {
          id: "ann-1",
          category: "Community Extension",
          title: "UCU Collaborates with DSWD on Kalahi-CIDSS Cash-for-Work Sustainable Infrastructure",
          desc: "Empowering vulnerable communities across Pangasinan through direct infrastructure livelihood support, civic engagement, and targeted poverty mitigation.",
          img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
          src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
          date: "March 15, 2025",
          isFeatured: false,
          relatedSdgs: [1, 8, 10],
          blocks: [
            {
              type: "paragraph",
              content: "Empowering vulnerable communities across Pangasinan through direct infrastructure livelihood support, civic engagement, and targeted poverty mitigation."
            },
            {
              type: "image",
              src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
              caption: "Community orientation and cash-for-work program mobilization at UCU."
            }
          ]
        }
      ]
    };
  }

  return {};
}
