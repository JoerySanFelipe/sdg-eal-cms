// admin/js/database-seeder.js
// Automated Database Migration & Seeder Engine for UCU SDG Web Portal

import { 
  db, 
  isFirebaseConfigured, 
  doc, 
  setDoc, 
  serverTimestamp 
} from './firebase-config.js';

import { SDG_METADATA, INDICATOR_PILLARS } from './cms-state.js';

function sanitizeForFirestore(val) {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(item => {
      if (Array.isArray(item)) return item.join(' | ');
      if (typeof item === 'object' && item !== null) return sanitizeForFirestore(item);
      return item;
    });
  }
  if (typeof val === 'object') {
    if (val._methodName || val.constructor?.name === 'FieldValue') return val;
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) res[k] = sanitizeForFirestore(v);
    }
    return res;
  }
  return val;
}

function safeSetDoc(docRef, data, options) {
  return setDoc(docRef, sanitizeForFirestore(data), options);
}

export class DatabaseSeeder {
  constructor() {
    this.totalSteps = 7;
    this.currentStep = 0;
  }

  /**
   * Run the full database migration and seed all collections
   */
  async runMigration(onProgress) {
    if (!isFirebaseConfigured() || !db) {
      throw new Error("Firebase is not configured or not initialized. Please ensure your project keys are saved.");
    }

    const log = (msg, percent) => {
      console.log(`[Database Seeder] ${msg}`);
      if (typeof onProgress === 'function') {
        onProgress({ message: msg, percent: Math.min(100, Math.round(percent)) });
      }
    };

    const results = {
      sdgs: 0,
      rankings: 0,
      events: 0,
      partners: 0,
      indicators: 0,
      evidence: 0,
      research: 0,
      settings: 0
    };

    log("Starting automated university database migration...", 5);

    // 1. Seed SDG Reports (SDG 1 to 17)
    log("Seeding all 17 SDG Narrative Reports (sdg_narratives)...", 15);
    results.sdgs = await this.seedSdgReports();

    // 2. Seed Institutional Rankings
    log("Seeding Institutional Rankings & Trajectory...", 30);
    results.rankings = await this.seedRankings();

    // 3. Seed Events & Community Activities
    log("Seeding Events and Community Engagement feed...", 45);
    results.events = await this.seedEvents();

    // 4. Seed Partners & Global Linkages
    log("Seeding Local and International Partners...", 60);
    results.partners = await this.seedPartners();

    // 5. Seed UI GreenMetric Indicators & Evidence
    log("Seeding UI GreenMetric 6 Pillars & Evidence Items...", 75);
    const indRes = await this.seedIndicators();
    results.indicators = indRes.indicators;
    results.evidence = indRes.evidence;

    // 6. Seed Research Publications
    log("Seeding Faculty Research & SDG Publications...", 90);
    results.research = await this.seedResearch();

    // 7. Seed Portal Settings & Homepage Aggregates
    log("Seeding Portal Global Settings & Public Page Baselines...", 98);
    results.settings = await this.seedPortalSettings();

    log("Database migration completed successfully!", 100);
    return results;
  }

  /**
   * 1. Seed SDG Reports (1 to 17)
   */
  async seedSdgReports() {
    let count = 0;

    for (let i = 1; i <= 17; i++) {
      const numStr = String(i);
      const meta = SDG_METADATA[numStr] || { title: `SDG ${i}`, subtitle: "", color: "#394a8a" };
      
      const metricsList = [
        { value: i === 1 ? "1,920" : String(i * 120 + 500), label: "Beneficiaries Reached", theme: "navy" },
        { value: i === 1 ? "45" : String(i * 4 + 10), label: "Active Programs", theme: "red" },
        { value: i === 1 ? "15" : String(i * 2 + 5), label: "Research Publications", theme: "navy" }
      ];

      const leadSummary = `Sustainable Development Goal ${i} (${meta.title}) drives institutional action at Urdaneta City University. Through innovative research, strategic partnerships, and community-led initiatives, UCU actively contributes to regional and global sustainable development targets.`;

      const sdgData = {
        reportYear: "2025",
        heroHeader: {
          goalName: `Sustainable Development Goal ${i}`,
          goalTitle: meta.title,
          subtitle: meta.subtitle,
          sdgNum: i,
          heroBackground: `../images/sdg-banner/sdg${i}.jpg`,
          heroIconImage: `../images/sdg/sdg${i}.png`,
          themeColor: meta.color
        },
        narrative: [
          {
            type: "metric_cards",
            metrics: metricsList
          },
          {
            type: "paragraph",
            content: leadSummary
          }
        ],
        impactDrawers: [
          {
            drawerTitle: `Institutional Framework for ${meta.title}`,
            isOpen: true,
            eventId: i === 1 ? "kalahi-cidss" : "",
            contents: [
              {
                type: "paragraph",
                content: `Urdaneta City University (UCU) deploys an evidence-based institutional framework aligned with United Nations Sustainable Development Goal ${i}. By integrating academic curricula with localized community outreaches, our university drives actionable solutions for regional sustainability.`
              },
              {
                type: "data_viz",
                vizType: "progress",
                title: "Strategic Impact Performance",
                subtitle: "Target vs Actual Outcome",
                payload: [
                  { label: "Community Participation", percentage: 92, barColorClass: "bg-ucu-blue-dark" },
                  { label: "Program Completion", percentage: 85, barColorClass: "bg-ucu-red" },
                  { label: "Long-Term Impact", percentage: 78, barColorClass: "bg-ucu-yellow" }
                ]
              }
            ]
          },
          {
            drawerTitle: `Community Action & Strategic Extension`,
            isOpen: false,
            eventId: "",
            contents: [
              {
                type: "paragraph",
                content: `Through the External Affairs and Linkages Office, UCU coordinates extension programs that empower local communities, vulnerable demographics, and regional partners across Pangasinan and Northern Luzon.`
              }
            ]
          }
        ],
        // Legacy mirrors for backward compatibility
        sdgNum: i,
        year: "2025",
        title: meta.title,
        subtitle: meta.subtitle,
        colorHex: meta.color,
        heroBgImage: `../images/sdg-banner/sdg${i}.jpg`,
        heroIconImage: `../images/sdg/sdg${i}.png`,
        metrics: metricsList,
        executiveSummary: leadSummary,
        subSections: [
          {
            title: `Institutional Framework for ${meta.title}`,
            content: `<p>Urdaneta City University (UCU) deploys an evidence-based institutional framework aligned with United Nations Sustainable Development Goal ${i}. By integrating academic curricula with localized community outreaches, our university drives actionable solutions for regional sustainability.</p>`
          },
          {
            title: `Community Action & Strategic Extension`,
            content: `<p>Through the External Affairs and Linkages Office, UCU coordinates extension programs that empower local communities, vulnerable demographics, and regional partners across Pangasinan and Northern Luzon.</p>`
          }
        ],
        updatedAt: serverTimestamp(),
        updatedBy: "migration-script@ucu.edu.ph"
      };

      // Set to central collection: sdg_narratives/sdg_{i}_2025
      await safeSetDoc(doc(db, 'sdg_narratives', `sdg_${i}_2025`), sdgData, { merge: true });

      // Backwards compatibility legacy document
      await safeSetDoc(doc(db, 'sdgs', `sdg_${i}`), sdgData, { merge: true });
      count++;
    }

    return count;
  }

  /**
   * 2. Seed Rankings
   */
  async seedRankings() {
    const rawRankings = [
      {
        id: "appliedhe-2025",
        org: "AppliedHE",
        year: "2025",
        rank: "#26",
        badge: "Ranked #26 in ASEAN Private & Local Universities",
        desc: "Recognized for exceptional Teaching and Learning, Employability, and Community Engagement across Southeast Asia.",
        logo: "images/rankings-logo/applied-he.png",
        metrics: [
          { label: "Teaching & Learning", score: "88.4 / 100" },
          { label: "Employability", score: "82.1 / 100" },
          { label: "Community Engagement", score: "94.5 / 100" },
          { label: "Research Impact", score: "71.2 / 100" }
        ],
        isFeatured: true
      },
      {
        id: "wuri-2025",
        org: "WURI",
        year: "2025",
        rank: "Top 100",
        badge: "World University Rankings for Innovation",
        desc: "Ranked globally for real-world impact, industrial applications, and student-driven ethical leadership initiatives.",
        logo: "images/rankings-logo/wuri.png",
        metrics: [
          { label: "Industrial Application", score: "Global Top 50" },
          { label: "Crisis Management", score: "Rank #34" },
          { label: "Social Responsibility", score: "Rank #18" }
        ],
        isFeatured: true
      },
      {
        id: "ui-greenmetric-2025",
        org: "UI GreenMetric",
        year: "2025",
        rank: "Top 200",
        badge: "World University Rankings on Sustainability",
        desc: "National leader in campus greening, sustainable water management, and energy-efficient infrastructure.",
        logo: "images/rankings-logo/ui-green-metric.png",
        metrics: [
          { label: "Setting & Infrastructure", score: "1,150 pts" },
          { label: "Energy & Climate", score: "1,425 pts" },
          { label: "Waste Management", score: "1,350 pts" },
          { label: "Water Conservation", score: "875 pts" }
        ],
        isFeatured: true
      },
      {
        id: "the-impact-2025",
        org: "THE Impact",
        year: "2025",
        rank: "601-800",
        badge: "Times Higher Education Impact Rankings",
        desc: "Global evaluation assessing UCU's research, stewardship, outreach, and teaching against UN Sustainable Development Goals.",
        logo: "images/rankings-logo/the-impact-rankings.png",
        metrics: [
          { label: "SDG 1 No Poverty", score: "Top 200" },
          { label: "SDG 4 Quality Education", score: "Top 300" },
          { label: "SDG 17 Partnerships", score: "Top 400" }
        ],
        isFeatured: true
      }
    ];

    for (const r of rawRankings) {
      await safeSetDoc(doc(db, 'rankings', r.id), {
        ...r,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return rawRankings.length;
  }

  /**
   * 3. Seed Events & Community Activities
   */
  async seedEvents() {
    const rawEvents = window.UCU_EVENTS || [
      {
        id: "kalahi-cidss",
        title: "Community Outreach: KALAHI-CIDSS Cash-for-Work Program",
        date: "March 15-22, 2025",
        desc: "UCU External Office partners with DSWD to mobilize youth leaders for localized community resilience and employment initiatives across Pangasinan.",
        img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
        src: "events/2025/kalahi-cidss.html",
        relatedSdgs: [1, 8, 10, 17],
        isFeatured: true,
        isHighlights: true,
        year: "2025",
        blocks: [
          {
            type: "callout",
            value: "1,920",
            label: "Marginalized Beneficiaries Supported",
            description: "Direct financial relief and vocational livelihood integration deployed across Urdaneta City."
          },
          {
            type: "image",
            src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic1.png",
            caption: "UCU Faculty and student volunteers mobilizing community baseline assessments with DSWD field officers."
          },
          {
            type: "paragraph",
            content: "In strategic coordination with the Department of Social Welfare and Development (DSWD), Urdaneta City University successfully deployed the **KALAHI-CIDSS Cash-for-Work program**. Over 1,900 student-volunteers and local beneficiaries were mobilized for localized public infrastructure restoration, environmental sanitation, and community baseline data collection."
          },
          {
            type: "paragraph",
            content: "This initiative exemplifies UCU's core commitment to **SDG 1 (No Poverty)**, **SDG 8 (Decent Work & Economic Growth)**, and **SDG 10 (Reduced Inequalities)** by bridging educational service with tangible socio-economic stabilization."
          }
        ]
      },
      {
        id: "smart-campus-launch",
        title: "UCU Unveils Phase 1 of the Smart Eco-Campus Initiative",
        date: "February 10, 2025",
        desc: "The university officially transitions to a 30% solar-powered grid, marking a massive milestone in our UI GreenMetric institutional commitments.",
        img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic2.png",
        src: "",
        relatedSdgs: [7, 9, 11, 13],
        isFeatured: true,
        isHighlights: true,
        year: "2025",
        blocks: [
          {
            type: "callout",
            value: "30%",
            label: "Solar-Powered Grid Transition",
            description: "Phase 1 completion of rooftop photovoltaic arrays across 5 campus buildings."
          },
          {
            type: "paragraph",
            content: "Urdaneta City University has reached a landmark sustainability milestone with the commissioning of its **Phase 1 Solar Grid Array**. Generating over 120,000 kWh annually, the system reduces institutional carbon emissions while serving as a live laboratory for engineering students."
          }
        ]
      },
      {
        id: "health-symposium",
        title: "International Symposium on Rural Health Diagnostics",
        date: "January 28, 2025",
        desc: "Global experts gather at the UCU Main Hall to discuss digital interventions for remote maternal health.",
        img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
        src: "",
        relatedSdgs: [3, 17],
        isFeatured: true,
        isHighlights: false,
        year: "2025"
      },
      {
        id: "gender-equality-forum",
        title: "Women in STEM: The 2025 Leadership Forum",
        date: "January 15, 2025",
        desc: "Celebrating our female engineering and IT students leading innovations in sustainable architecture.",
        img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
        src: "",
        relatedSdgs: [4, 5, 10],
        isFeatured: true,
        isHighlights: false,
        year: "2025"
      }
    ];

    for (const ev of rawEvents) {
      await safeSetDoc(doc(db, 'events', ev.id), {
        ...ev,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return rawEvents.length;
  }

  /**
   * 4. Seed Partners
   */
  async seedPartners() {
    const rawPartners = window.UCU_PARTNERS || [
      { name: "DOST Pangasinan", category: "local-government", type: "local", logoSrc: "images/partners/dost.png", url: "https://dost.gov.ph" },
      { name: "LGU Urdaneta City", category: "local-government", type: "local", logoSrc: "images/partners/urdaneta-lgu.png", url: "https://urdaneta-city.gov.ph" },
      { name: "Tokyo Institute of Technology", category: "international-academic", type: "international", logoSrc: "images/partners/tokyo-tech.png", url: "https://titech.ac.jp" },
      { name: "SEAMEO Regional Center", category: "international-government", type: "international", logoSrc: "images/partners/seameo.png", url: "https://seameo.org" }
    ];

    let count = 0;
    for (const p of rawPartners) {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!slug) continue;

      let partnerType = "Local Academic";
      if (p.category === 'local-industry') partnerType = "Local Industry";
      else if (p.category === 'international-academic') partnerType = "International Academic";
      else if (p.category === 'international-industry') partnerType = "International Industry";
      else if (p.category === 'membership') partnerType = "Memberships";

      await safeSetDoc(doc(db, 'partners', slug), {
        name: p.name,
        category: p.category || "local-academic",
        type: partnerType,
        logoSrc: p.logoSrc || "",
        url: p.url || "",
        updatedAt: serverTimestamp()
      }, { merge: true });

      count++;
    }

    return count;
  }

  /**
   * 5. Seed Indicators & Evidence Items
   */
  async seedIndicators() {
    let indCount = 0;
    let evCount = 0;

    const evidenceByPillar = {
      infrastructure: [
        {
          id: "1_3",
          code: "1.3",
          title: "1.3 Number of Campus Sites",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_3.html",
          relatedSdgs: [4, 9, 11],
          blocks: [
            {
              type: "callout",
              value: "39",
              label: "Campus Buildings and Infrastructure Facilities",
              description: "There are 39 buildings on the UCU campus, including administrative buildings, academic buildings, research centers, student centers, and other facilities."
            },
            {
              type: "image",
              src: "images/evidence/1.3/image40.png",
              caption: "Urdaneta City University Site Development Plan showing campus layout and buildings"
            },
            {
              type: "table",
              headers: ["Image", "Facility Name", "Description", "Construction Date"],
              rows: [
                "images/evidence/1.3/image1.png | Turnstile | Main guard house and gate for students. | January 2016 – February 2017",
                "images/evidence/1.3/image2.jpg | Business Center | Originally created for stalls and the Tourism Department. | 2005",
                "images/evidence/1.3/image3.jpg | UCU RRDMC | Building of UCU RRDMC, COO, VP Acad, and Legal Office. | July 5, 2017",
                "images/evidence/1.3/image4.jpg | Administration Building | Registrar, Cashier, Accounting, HR, Research Dept, and AUP office. | September 2014 – March 2017"
              ]
            }
          ]
        },
        {
          id: "1_4",
          code: "1.4",
          title: "1.4 Main Campus Setting",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_4.html",
          relatedSdgs: [4, 11, 15]
        },
        {
          id: "1_5",
          code: "1.5",
          title: "1.5 Total Main Campus Area",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_5.html",
          relatedSdgs: [4, 11, 15]
        },
        {
          id: "1_7",
          code: "1.7",
          title: "1.7 Total Campus Buildings Area",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_7.html",
          relatedSdgs: [3, 4, 9, 11, 15]
        },
        {
          id: "1_8",
          code: "1.8",
          title: "1.8 The Ratio of Open Space Area to Total Area",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_8.html",
          relatedSdgs: [11, 13, 15]
        },
        {
          id: "1_9",
          code: "1.9",
          title: "1.9 Total Area on Campus Covered in Forest Vegetation Used for Research, Teaching, and/or Community Engagement (meter2)",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_9.html",
          relatedSdgs: [3, 4, 11, 15]
        },
        {
          id: "1_10",
          code: "1.10",
          title: "1.10 Total Area on Campus Covered in Planted Vegetation (meter 2)",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_10.html",
          relatedSdgs: [3, 4, 11, 15]
        },
        {
          id: "1_15",
          code: "1.15",
          title: "1.15 Campus Facilities for Disabled, Special Needs and Maternity Care",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_15.html",
          relatedSdgs: [3, 4, 5, 10, 11]
        },
        {
          id: "1_16",
          code: "1.16",
          title: "1.16 Safety and Security Infrastructure",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_16.html",
          relatedSdgs: [3, 11, 16]
        },
        {
          id: "1_17",
          code: "1.17",
          title: "1.17 Health and Safety Infrastructure",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_17.html",
          relatedSdgs: [3, 4, 11]
        },
        {
          id: "1_18",
          code: "1.18",
          title: "1.18 Genetic Resource Conservation Facilities",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_18.html",
          relatedSdgs: [2, 15]
        },
        {
          id: "1_19",
          code: "1.19",
          title: "1.19 Green Campus Outdoor Features",
          badge: "Setting and Infrastructure",
          src: "../evidence/infrastructure/1_19.html",
          relatedSdgs: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17]
        }
      ],
      energy: [
        { id: "2_1", code: "2.1", title: "2.1 Energy Efficient Appliances Usage", badge: "Energy and Climate Change", src: "../evidence/energy/2_1.html", relatedSdgs: [7, 12, 13] },
        { id: "2_3", code: "2.3", title: "2.3 Smart Building Implementation", badge: "Energy and Climate Change", src: "../evidence/energy/2_3.html", relatedSdgs: [7, 9, 11, 13] },
        { id: "2_5", code: "2.5", title: "2.5 Renewable Energy Sources in Campus", badge: "Energy and Climate Change", src: "../evidence/energy/2_5.html", relatedSdgs: [7, 11, 13] },
        { id: "2_6", code: "2.6", title: "2.6 Electricity Usage Per Year (in Kilowatt Hour)", badge: "Energy and Climate Change", src: "../evidence/energy/2_6.html", relatedSdgs: [7, 12, 13] },
        { id: "2_8", code: "2.8", title: "2.8 Ratio of Renewable Energy Production Divided by Total Energy Usage Per Year", badge: "Energy and Climate Change", src: "../evidence/energy/2_8.html", relatedSdgs: [7, 12, 13] },
        { id: "2_9", code: "2.9", title: "2.9 Elements of Green Building Implementation As Reflected in All Buildings", badge: "Energy and Climate Change", src: "../evidence/energy/2_9.html", relatedSdgs: [3, 6, 7, 9, 11, 12, 13] },
        { id: "2_10", code: "2.10", title: "2.10 Greenhouse Gas Emission Reduction Program", badge: "Energy and Climate Change", src: "../evidence/energy/2_10.html", relatedSdgs: [7, 13] },
        { id: "2_11", code: "2.11", title: "2.11 The Total Carbon Footprint (co2emission in the Last 12 Months, in Metric Tons)", badge: "Energy and Climate Change", src: "../evidence/energy/2_11.html", relatedSdgs: [7, 13] }
      ],
      waste: [
        { id: "3_1", code: "3.1", title: "3.1 3r (reduce, Reuse and Recycle) Program for University Waste", badge: "Waste", src: "../evidence/waste/3_1.html", relatedSdgs: [4, 11, 12] },
        { id: "3_2", code: "3.2", title: "3.2 Total Volume of Paper and Plastic Produced This Year", badge: "Waste", src: "../evidence/waste/3_2.html", relatedSdgs: [11, 12, 13] },
        { id: "3_3", code: "3.3", title: "3.3 Total Volume of Paper and Plastic Produced Last Year", badge: "Waste", src: "../evidence/waste/3_3.html", relatedSdgs: [11, 12, 13] },
        { id: "3_4", code: "3.4", title: "3.4 Program to Reduce the Use of Paper and Plastic on Campus (WS.2)", badge: "Waste", src: "../evidence/waste/3_4.html", relatedSdgs: [3, 4, 8, 9, 11, 12, 13, 14, 15, 16, 17] },
        { id: "3_5", code: "3.5", title: "3.5 Total Volume Organic Waste Produced This Year", badge: "Waste", src: "../evidence/waste/3_5.html", relatedSdgs: [11, 12, 15] },
        { id: "3_6", code: "3.6", title: "3.6 Total Volume Organic Waste Produced Last Year", badge: "Waste", src: "../evidence/waste/3_6.html", relatedSdgs: [11, 12, 15] }
      ],
      water: [
        { id: "4_1", code: "4.1", title: "4.1 Water Conservation Program & Implementation", badge: "Water", src: "../evidence/water/4_1.html", relatedSdgs: [6, 12, 14] },
        { id: "4_2", code: "4.2", title: "4.2 Water Recycling Program Implementation", badge: "Water", src: "../evidence/water/4_2.html", relatedSdgs: [6, 12] },
        { id: "4_3", code: "4.3", title: "4.3 Water Efficient Appliances Usage", badge: "Water", src: "../evidence/water/4_3.html", relatedSdgs: [6, 12] }
      ],
      transportation: [
        { id: "5_1", code: "5.1", title: "5.1 Sustainable Transportation Initiatives", badge: "Transportation", src: "../evidence/transportation/5_1.html", relatedSdgs: [11, 13] },
        { id: "5_4", code: "5.4", title: "5.4 Zero Emission Vehicles (ZEV) on Campus", badge: "Transportation", src: "../evidence/transportation/5_4.html", relatedSdgs: [7, 11, 13] },
        { id: "5_5", code: "5.5", title: "5.5 Pedestrian Path Policy on Campus", badge: "Transportation", src: "../evidence/transportation/5_5.html", relatedSdgs: [3, 11] }
      ],
      education: [
        { id: "6_1", code: "6.1", title: "6.1 Sustainability Courses Offered", badge: "Education and Research", src: "../evidence/education/6_1.html", relatedSdgs: [4, 17] },
        { id: "6_2", code: "6.2", title: "6.2 Sustainability Research Funding & Publications", badge: "Education and Research", src: "../evidence/education/6_2.html", relatedSdgs: [4, 9, 17] },
        { id: "6_3", code: "6.3", title: "6.3 Sustainability Student Organizations", badge: "Education and Research", src: "../evidence/education/6_3.html", relatedSdgs: [4, 11, 17] }
      ]
    };

    for (const pillar of INDICATOR_PILLARS) {
      const fullBaseline = cmsState.getBaselineData({ type: 'indicator', id: pillar.id });
      const evidences = fullBaseline.evidences || [];

      const pDoc = {
        indicatorId: pillar.id,
        indicatorNum: pillar.num,
        indicatorTitle: pillar.title,
        thumb_image: fullBaseline.thumb_image || pillar.img || `images/smart-eco-assets/${pillar.id}.jpg`,
        thumb_evidence: fullBaseline.thumb_evidence || `images/indicator-icons/${pillar.id}.png`,
        metricsCard: fullBaseline.metricsCard || [],
        narrative: fullBaseline.narrative || '',
        updatedAt: serverTimestamp(),
        updatedBy: "migration-script@ucu.edu.ph"
      };

      await safeSetDoc(doc(db, 'indicators', pillar.id), pDoc, { merge: true });
      indCount++;

      for (const ev of evidences) {
        const docId = ev.id ? ev.id.replace(/\./g, '_') : (ev.codeID ? ev.codeID.replace(/\./g, '_') : '');
        if (!docId) continue;

        await safeSetDoc(doc(db, 'evidences', docId), {
          codeID: ev.codeID || docId.replace(/_/g, '.'),
          referenceId: pillar.num,
          title: ev.title || '',
          badge: ev.badge || pillar.title,
          relatedSdgs: Array.isArray(ev.relatedSdgs) ? ev.relatedSdgs : [],
          src: ev.src || `../evidence/${pillar.id}/${docId}.html`,
          thumb_evidence: ev.thumb_evidence || ev.img || 'images/smart-eco-assets/ui-green-seal.png',
          year: "2025",
          updatedAt: serverTimestamp()
        }, { merge: true });
        evCount++;
      }

      // Also persist to `cms_content/indicator_${pillar.id}` with backwards-compatible payload
      await safeSetDoc(doc(db, 'cms_content', `indicator_${pillar.id}`), {
        sectionType: 'indicator',
        sectionId: pillar.id,
        data: {
          ...pDoc,
          // Aliases for compatibility
          pillarId: pillar.id,
          pillarNum: pillar.num,
          pillarTitle: pillar.title,
          thumbnailImg: pDoc.thumb_image,
          metrics: pDoc.metricsCard,
          evidenceList: evidences
        },
        updatedAt: serverTimestamp(),
        updatedBy: "migration-script@ucu.edu.ph"
      }, { merge: true });
    }

    return { indicators: indCount, evidence: evCount };
  }

  /**
   * 6. Seed Research
   */
  async seedResearch() {
    const rawResearch = window.UCU_RESEARCH || [
      {
        id: "santos-digital-health-2025",
        title: "Impact of Digital Health Interventions on Rural Education Outcomes",
        authors: "Dr. Maria Santos, et al.",
        date: "Oct 2025",
        abstract: "This study evaluates the intersection of adolescent health and academic performance in Northern Luzon. By deploying targeted digital health tracking within the localized curriculum, the research demonstrates a significant correlation between well-being interventions and improved scholastic retention rates among marginalized communities.",
        sdgs: [3, 4],
        keywords: ["Adolescent Health", "Digital Health", "Scholastic Retention"],
        pdfLink: "../documents/santos-et-al.pdf"
      },
      {
        id: "dela-cruz-cash-for-work-2025",
        title: "Economic Efficacy of Cash-for-Work Programs in Pangasinan",
        authors: "Prof. Juan dela Cruz",
        date: "Mar 2025",
        abstract: "An analysis of the DSWD's KALAHI-CIDSS initiative. This paper examines the short-term economic stabilization provided by cash-for-work frameworks in highly vulnerable sectors of Urdaneta City, establishing metrics for sustainable inclusive growth and the reduction of regional income inequalities.",
        sdgs: [1, 8, 10],
        keywords: ["Cash-for-Work", "Inclusive Growth", "Economic Efficacy"],
        pdfLink: "#"
      },
      {
        id: "indigenous-flora-2024",
        title: "Climate Resilience of Indigenous Flora in Northern Agno Basin",
        authors: "College of Agriculture Research Team",
        date: "Nov 2024",
        abstract: "Investigating the adaptive mechanisms of local plant species against increasingly severe weather anomalies. The research outlines actionable strategies for preserving terrestrial ecosystems and reinforcing agricultural security amidst shifting climate patterns in Region I.",
        sdgs: [13, 15],
        keywords: ["Climate Resilience", "Indigenous Flora", "Agno Basin"],
        pdfLink: "#"
      }
    ];

    for (const r of rawResearch) {
      const docId = r.id || r.title.toLowerCase().slice(0, 30).replace(/[^a-z0-9]/g, '-');
      await safeSetDoc(doc(db, 'research', docId), {
        ...r,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return rawResearch.length;
  }

  /**
   * 7. Seed Portal Settings & Page Baselines
   */
  async seedPortalSettings() {
    const rawEvents = window.UCU_EVENTS || [];
    const rawResearch = window.UCU_RESEARCH || [];

    // 1. Seed pages/home
    await safeSetDoc(doc(db, 'pages', 'home'), {
      sectionType: 'home',
      sectionId: 'main',
      heroEyebrow: "Official Institutional Web Portal",
      heroHeadline: "External Affairs & Linkages",
      heroHighlight: "Office",
      heroDescription: "Urdaneta City University's central gateway for global linkages, academic collaborations, SDG tracking, and community extension programs.",
      metricsEyebrow: "Institutional Impact",
      metricsTitle: "Strength in Numbers",
      metrics: [
        { value: "48", label: "Engagements & Events", theme: "white", icon: "calendar", svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
        { value: "17", label: "UN SDGs Addressed", theme: "navy", icon: "target", svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>` },
        { value: "42", label: "Active Linkages", theme: "red", icon: "handshake", svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>` },
        { value: "109", label: "Partner Institutions", theme: "white", icon: "users", svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` }
      ],
      allianceTitle: "Forge a Strategic Alliance",
      allianceDescription: "Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.",
      partnershipFormUrl: "https://forms.google.com/your-form-id-here",
      emailExternal: "externalaffairsandlinkages@ucu.edu.ph",
      emailOfficial: "officeofthepresident@ucu.edu.ph",
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    // 2. Seed pages/impact_2025 (Safe Merge)
    let finalEvents = rawEvents;
    try {
      const snap = await getDoc(doc(db, 'pages', 'impact_2025'));
      if (snap.exists()) {
        const existing = snap.data();
        if (existing && Array.isArray(existing.eventsList) && existing.eventsList.length > 0) {
          const customOnly = existing.eventsList.filter(e => !rawEvents.some(r => r.id === e.id));
          finalEvents = [...rawEvents, ...customOnly];
        }
      }
    } catch (e) {}

    await safeSetDoc(doc(db, 'pages', 'impact_2025'), {
      sectionType: 'impact',
      sectionId: '2025',
      year: '2025',
      heroEyebrow: "Institutional Impact & Engagements",
      heroHeadline: "Measuring UCU's",
      heroHighlight: "Real-World Impact",
      heroDescription: "Comprehensive timeline of outreach activities, medical missions, environmental drives, and community-partnered initiatives aligned with the UN Sustainable Development Goals.",
      metrics: [
        { metricId: "upcomingEvents", value: "3", label: "Upcoming Initiatives", theme: "white" },
        { metricId: "totalEvents", value: "48", label: "Total Engagements", theme: "white" },
        { metricId: "beneficiariesReached", value: "12,450", label: "Community Reached", theme: "white" },
        { metricId: "sdgsAddressed", value: "17", label: "SDGs Addressed", theme: "white" }
      ],
      eventsList: finalEvents,
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    // 3. Seed pages/research_2025 (Safe Merge)
    let finalResearch = rawResearch;
    try {
      const snap = await getDoc(doc(db, 'pages', 'research_2025'));
      if (snap.exists()) {
        const existing = snap.data();
        if (existing && Array.isArray(existing.researchList) && existing.researchList.length > 0) {
          const customOnly = existing.researchList.filter(r => !rawResearch.some(seedR => seedR.id === r.id));
          finalResearch = [...rawResearch, ...customOnly];
        }
      }
    } catch (e) {}

    await safeSetDoc(doc(db, 'pages', 'research_2025'), {
      sectionType: 'research',
      sectionId: '2025',
      year: '2025',
      heroEyebrow: "Institutional Archive",
      heroHeadline: "SDG Research",
      heroHighlight: "Archive.",
      heroDescription: "An open-access archive of Urdaneta City University's academic contributions. Explore peer-reviewed publications, institutional studies, and localized research directly aligned with the United Nations' Sustainable Development Goals.",
      researchList: finalResearch,
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    // 4. Seed pages/rankings
    await safeSetDoc(doc(db, 'pages', 'rankings'), {
      sectionType: 'rankings',
      sectionId: 'main',
      heroEyebrow: "A Network of Excellence",
      heroHeadline: "Connecting UCU",
      heroHighlight: "Globally",
      heroDescription: "Forging high-impact relationships with global academic institutions and premier industry leaders to elevate the educational standard of Urdaneta City University.",
      standingTitle: "Current Global Standing",
      standingSubtitle: "Verified Institutional Performance Across Prestigious International Ranking Frameworks",
      trajectoryEyebrow: "Trajectory of Success",
      trajectoryTitle: "Historical Performance Timeline",
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    // 5. Seed pages/partnerships
    await safeSetDoc(doc(db, 'pages', 'partnerships'), {
      sectionType: 'partnership',
      sectionId: 'main',
      heroEyebrow: "Trusted Connections. Global Vision.",
      heroHeadline: "UCU Beyond",
      heroHighlight: "Borders",
      heroDescription: "Creating lasting partnerships that empower education, elevate standards, and connect Urdaneta City University to opportunities across the world.",
      metrics: [
        { metricId: "activeMous", value: "42", label: "Active MOUs", theme: "white" },
        { metricId: "globalPartners", value: "24", label: "International Partners", theme: "white" },
        { metricId: "localPartners", value: "85", label: "Local Partners", theme: "white" },
        { metricId: "membershipPartners", value: "18", label: "Memberships", theme: "white" },
        { metricId: "totalCountries", value: "12", label: "Partner Countries", theme: "white" }
      ],
      allianceTitle: "Forge a Strategic Alliance",
      allianceDescription: "Urdaneta City University (UCU) actively seeks to expand its global and local network through high-impact institutional linkages. We invite esteemed academic organizations and industry leaders to initialize formal collaboration proposals via our centralized portal.",
      partnershipFormUrl: "https://forms.google.com/your-form-id-here",
      emailExternal: "externalaffairsandlinkages@ucu.edu.ph",
      emailOfficial: "officeofthepresident@ucu.edu.ph",
      countries: window.UCU_COUNTRIES || [],
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    // 6. Seed pages/smart_eco_campus
    await safeSetDoc(doc(db, 'pages', 'smart_eco_campus'), {
      sectionType: 'smarteco',
      sectionId: 'main',
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
      concludingParagraph: "These seven sustainability indicators form the strategic framework of Urdaneta City University’s Smart Eco Campus initiative. By aggressively aligning our institutional metrics with global environmental standards—such as the UI GreenMetric framework—we do more than cultivate a green learning environment. We forge high-impact linkages with international stakeholders, driving collaborative research and scalable sustainable practices that elevate our graduates to global competitiveness.",
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    // 7. Seed pages/announcements
    await safeSetDoc(doc(db, 'pages', 'announcements'), {
      sectionType: 'announcement',
      sectionId: 'announcements',
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
        },
        {
          id: "ann-2",
          category: "Green Campus",
          title: "Smart Eco Campus Initiative Receives Landmark UI GreenMetric Global Standing",
          desc: "Ranked #1 Local University in the Philippines and #1 in Water Management Category worldwide, driving institutional climate action and clean energy.",
          img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
          src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
          date: "February 10, 2025",
          isFeatured: false,
          relatedSdgs: [6, 7, 11, 13],
          blocks: [
            {
              type: "paragraph",
              content: "Ranked #1 Local University in the Philippines and #1 in Water Management Category worldwide, driving institutional climate action and clean energy."
            },
            {
              type: "image",
              src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic3.png",
              caption: "Smart Eco Campus sustainability initiatives on display."
            }
          ]
        },
        {
          id: "ann-3",
          category: "Academic Linkages",
          title: "UCU Signs New International Memorandums of Understanding Across ASEAN Region",
          desc: "Broadening cross-border faculty mobility, student exchanges, and joint peer-reviewed publications with premier Southeast Asian partner universities.",
          img: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
          src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
          date: "January 28, 2025",
          isFeatured: false,
          relatedSdgs: [4, 17],
          blocks: [
            {
              type: "paragraph",
              content: "Broadening cross-border faculty mobility, student exchanges, and joint peer-reviewed publications with premier Southeast Asian partner universities."
            },
            {
              type: "image",
              src: "images/events/Kalahi-CIDSS-Cash-for-Work/Pic4.png",
              caption: "Formal MOU signing ceremonies with international academic delegations."
            }
          ]
        }
      ],
      updatedAt: serverTimestamp(),
      updatedBy: "migration-script@ucu.edu.ph"
    }, { merge: true });

    return 7;
  }
}

export const databaseSeeder = new DatabaseSeeder();

