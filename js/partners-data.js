// js/partners-data.js

/**
 * UCU Institutional Linkages & Memberships Data Store
 * Schema:
 * - name: Official name of the institution/organization
 * - category: 'international-academic' | 'international-industry' | 'local-academic' | 'local-industry' | 'membership'
 * - logoSrc: Relative path to the logo image
 * - url: Official website (leave empty string "" if none exists to disable linking)
 */

window.UCU_PARTNERS = [
  // --- LOCAL ACADEMIC PARTNERS (Universities & Schools) ---
  { name: "Adventist University of the Philippines", category: "local-academic", logoSrc: "./images/local-partners/Adventist-University-of-the-Philippines.png", url: "" },
  { name: "Air Link International Aviation College", category: "local-academic", logoSrc: "./images/local-partners/Air-Link-International-Aviation-College.png", url: "" },
  { name: "Ateneo De Davao University", category: "local-academic", logoSrc: "./images/local-partners/ateneo-de-davao-university.png", url: "" },
  { name: "Baguio Central University", category: "local-academic", logoSrc: "./images/local-partners/Baguio-Central-University.png", url: "" },
  { name: "Baliuag University", category: "local-academic", logoSrc: "./images/local-partners/baliuag-university.png", url: "" },
  { name: "Benguet State University", category: "local-academic", logoSrc: "./images/local-partners/BSU.png", url: "" },
  { name: "Central Mindanao University", category: "local-academic", logoSrc: "./images/local-partners/Central-mindanao-university.png", url: "" },
  { name: "City College of San Jose Del Monte", category: "local-academic", logoSrc: "./images/local-partners/city-college-of-san-jose-del-monte.png", url: "" },
  { name: "Colegio San Agustin - Bacolod", category: "local-academic", logoSrc: "./images/local-partners/colegio-of-san-agustin-bacolod.png", url: "" },
  { name: "Davao Oriental State University", category: "local-academic", logoSrc: "./images/local-partners/davao-oriental-state-university.png", url: "" },
  { name: "De La Salle Medical and Health Sciences Institute", category: "local-academic", logoSrc: "./images/local-partners/de-la-salle-medical-and-health-sciences-institute.png", url: "" },
  { name: "Dr. Yanga's Colleges, Inc.", category: "local-academic", logoSrc: "./images/local-partners/Dr-Yanga-Colleges-Inc.png", url: "" },
  { name: "Eastern Visayas State University", category: "local-academic", logoSrc: "./images/local-partners/Eastern-Visayas-State-University.png", url: "" },
  { name: "Goldenstate College - General Santos City", category: "local-academic", logoSrc: "./images/local-partners/Goldenstate-college-general-santos-city-philipines.png", url: "" },
  { name: "Green Valley College Foundation, Inc.", category: "local-academic", logoSrc: "./images/local-partners/Green-Valley-College-Foundation-Inc.png", url: "" },
  { name: "Holy Cross of Davao College", category: "local-academic", logoSrc: "./images/local-partners/holy-cross-of-davao-college.png", url: "" },
  { name: "Holy Name University", category: "local-academic", logoSrc: "./images/local-partners/holy-name-university.png", url: "" },
  { name: "Holy Trinity College of General Santos City", category: "local-academic", logoSrc: "./images/local-partners/holy-trinity-college-of-general-santos-city.png", url: "" },
  { name: "Iloilo Science and Technology University", category: "local-academic", logoSrc: "./images/local-partners/ISTU.png", url: "" },
  { name: "John B. Lacson Foundation Maritime University", category: "local-academic", logoSrc: "./images/local-partners/john-b-lacson-foundation-maritime-university.png", url: "" },
  { name: "Kalinga State University", category: "local-academic", logoSrc: "./images/local-partners/KSU.png", url: "" },
  { name: "Lananpin National High School", category: "local-academic", logoSrc: "./images/local-partners/LananpinNHS.png", url: "" },
  { name: "Leyte Normal University", category: "local-academic", logoSrc: "./images/local-partners/LeyteNU.png", url: "" },
  { name: "Lyceum of the Philippines University – Batangas", category: "local-academic", logoSrc: "./images/local-partners/Lyceum-of-the-philippines-university-batangas.png", url: "" },
  { name: "Manuel S. Enverga University Foundation", category: "local-academic", logoSrc: "./images/local-partners/manuel-s-enverga-university-foundation.png", url: "" },
  { name: "Maritime Polytechnic College Foundation of Canaman Inc.", category: "local-academic", logoSrc: "./images/local-partners/maritime-polytechnic-college-foundation.png", url: "" },
  { name: "Mariners Polytechnic Colleges Foundation - Legazpi", category: "local-academic", logoSrc: "./images/local-partners/Mariners-polytechnic-colleges-foundation.png", url: "" },
  { name: "Misamis University", category: "local-academic", logoSrc: "./images/local-partners/misamis-university.png", url: "" },
  { name: "Naga College Foundation Inc.", category: "local-academic", logoSrc: "./images/local-partners/Naga-College-Foundation-Inc.png", url: "" },
  { name: "Northwestern University - Laoag City", category: "local-academic", logoSrc: "./images/local-partners/northwestern-university.png", url: "" },
  { name: "Osias Educational Foundation Inc.", category: "local-academic", logoSrc: "./images/local-partners/oasis-educational-foundation-inc.png", url: "" },
  { name: "Polytechnic College of Botolan", category: "local-academic", logoSrc: "./images/local-partners/Polytechnic-College-of-Botolan.png", url: "" },
  { name: "Samar College - Catbalogan", category: "local-academic", logoSrc: "./images/local-partners/Samar-college.png", url: "" },
  { name: "San Pedro College - Davao City", category: "local-academic", logoSrc: "./images/local-partners/san-pedro-college-davao-city.png", url: "" },
  { name: "SDO-Urdaneta City", category: "local-academic", logoSrc: "./images/local-partners/SDO-URD.png", url: "" },
  { name: "St. Bernadette Lourdes College", category: "local-academic", logoSrc: "./images/local-partners/SBLC.png", url: "" },
  { name: "St. Michael's College of Iligan Inc.", category: "local-academic", logoSrc: "./images/local-partners/saint-michael_s-college-of-iligan.png", url: "" },
  { name: "St. Paul University - Dumaguete City", category: "local-academic", logoSrc: "./images/local-partners/st-paul-university-dumaguete.png", url: "" },
  { name: "St. Paul University Philippines - Quezon City", category: "local-academic", logoSrc: "./images/local-partners/st-paul-university-qc.png", url: "" },
  { name: "St. Paul University Philippines - Tuguegarao City", category: "local-academic", logoSrc: "./images/local-partners/st-paul-university-philippines.png", url: "" },
  { name: "Union Christian College", category: "local-academic", logoSrc: "./images/local-partners/union-christian-college.png", url: "" },
  { name: "Universidad De Sta. Maria Isabela De Naga, Inc.", category: "local-academic", logoSrc: "./images/local-partners/universidad-de-sta-isabel-de-naga-inc.png", url: "" },
  { name: "University of Baguio", category: "local-academic", logoSrc: "./images/local-partners/UB.png", url: "" },
  { name: "University of Cagayan Valley", category: "local-academic", logoSrc: "./images/local-partners/university-of-cagayan-valley.png", url: "" },
  { name: "University of Eastern Philippines - Catarman N. Samar", category: "local-academic", logoSrc: "./images/local-partners/University-of-eastern-philippines-catarman-n-samar.png", url: "" },
  { name: "University of La Salette Inc.", category: "local-academic", logoSrc: "./images/local-partners/university-of-la-salette-inc.png", url: "" },
  { name: "University of Makati", category: "local-academic", logoSrc: "./images/local-partners/University-of-makati.png", url: "" },
  { name: "University of Negros Occidental - Recoletos Inc.", category: "local-academic", logoSrc: "./images/local-partners/university-of-negros-occidental-recoletos-inc.png", url: "" },
  { name: "University of Nueva Caceres", category: "local-academic", logoSrc: "./images/local-partners/university-of-nueva-caceres.png", url: "" },
  { name: "University od Santo Tomas - Legazpi", category: "local-academic", logoSrc: "./images/local-partners/university-of-santo-tomas-legazpi.png", url: "" },
  { name: "University of the Immaculate Conception", category: "local-academic", logoSrc: "./images/local-partners/university-of-the-immaculate-conception.png", url: "" },

  // --- LOCAL INDUSTRY PARTNERS ---
  { name: "Beyond Books Publication", category: "local-industry", logoSrc: "./images/local-partners/Beyond-Books-Publication.png", url: "" },
  { name: "Center for Pangasinan Studies", category: "local-industry", logoSrc: "./images/local-partners/CPS.png", url: "" },
  { name: "Commission on Human Rights-RO1", category: "local-industry", logoSrc: "./images/local-partners/CHR-1.png", url: "" },
  { name: "Global Professional Advancement", category: "local-industry", logoSrc: "./images/local-partners/GPA.png", url: "" },
  { name: "Philippine Red Cross", category: "local-industry", logoSrc: "./images/local-partners/Redcross.png", url: "" },
  { name: "Urdaneta District Jail Male Dorm", category: "local-industry", logoSrc: "./images/local-partners/BJMP.png", url: "" },

  // --- INTERNATIONAL ACADEMIC PARTNERS ---
  { name: "Abdullah Gul University", category: "international-academic", logoSrc: "./images/international-partners/abdullah-gul-university.png", url: "" },
  { name: "American University of Sovereign Nations", category: "international-academic", logoSrc: "./images/international-partners/ausovereignnations.png", url: "https://ausovereignnations.org/" },
  { name: "aSSIST University", category: "international-academic", logoSrc: "./images/international-partners/aSSIST.png", url: "" },
  { name: "Chandigarh Group of Colleges", category: "international-academic", logoSrc: "./images/international-partners/Chandigarh-Group.png", url: "" },
  { name: "Chitkara University", category: "international-academic", logoSrc: "./images/international-partners/chitkara-university.png", url: "" },
  { name: "Da-Yeh University", category: "international-academic", logoSrc: "./images/international-partners/Da-Yeh-University.png", url: "" },
  { name: "Deggendorf Institute of Technology", category: "international-academic", logoSrc: "./images/international-partners/dit-logo-grau.png", url: "" },
  { name: "Ecolde 42", category: "international-academic", logoSrc: "./images/international-partners/Ecole-42.png", url: "" },
  { name: "Incheon National University", category: "international-academic", logoSrc: "./images/international-partners/incheon-national-university.png", url: "" },
  { name: "Institut Teknologi Sepuluh Nopember (ITS) Indonesia", category: "international-academic", logoSrc: "./images/international-partners/ITS.png", url: "" },
  { name: "Konan University", category: "international-academic", logoSrc: "./images/international-partners/Konan-University.png", url: "" },
  { name: "Lac Hong University", category: "international-academic", logoSrc: "./images/international-partners/lac-hong-university.png", url: "" },
  { name: "Minerva University", category: "international-academic", logoSrc: "./images/international-partners/minerva-university.png", url: "" },
  { name: "National Chi Nan University", category: "international-academic", logoSrc: "./images/international-partners/national-chi-nan-university.png", url: "" },
  { name: "Northwestern University - Illinois", category: "international-academic", logoSrc: "./images/local-partners/NWU.png", url: "" },
  { name: "Portsworld Academy Malaysia", category: "international-academic", logoSrc: "./images/international-partners/Portsworlds.png", url: "" },
  { name: "Powiślański University", category: "international-academic", logoSrc: "./images/international-partners/Powislanski-University.png", url: "" },
  { name: "Richmond American University, London", category: "international-academic", logoSrc: "./images/international-partners/Richmond-American.png", url: "" },
  { name: "SDG Management School", category: "international-academic", logoSrc: "./images/international-partners/SDGMS.png", url: "" },
  { name: "Seoul National University (Human Resource Research Center)", category: "international-academic", logoSrc: "./images/international-partners/seoul-national-university.png", url: "" },
  { name: "Siam University", category: "international-academic", logoSrc: "./images/international-partners/siam-university.png", url: "" },
  { name: "Tongmyong University", category: "international-academic", logoSrc: "./images/international-partners/Tongmyong.png", url: "" },
  { name: "Universitas Gadjah Mada", category: "international-academic", logoSrc: "./images/international-partners/Universitas-gadjah-mada-indonesia.png", url: "" },
  { name: "Universitas Pendidikan Ganeshia", category: "international-academic", logoSrc: "./images/international-partners/Ganeshia.png", url: "" },
  { name: "Universitas Persada Indonesia", category: "international-academic", logoSrc: "./images/international-partners/Universitas-Persada-Indonesia.png", url: "" },
  { name: "University of Liberal Arts Bangladesh", category: "international-academic", logoSrc: "./images/international-partners/University-of-Liberal-Arts-Bangladesh.png", url: "" },
  { name: "University of Mostar", category: "international-academic", logoSrc: "./images/international-partners/Mostar.png", url: "" },
  { name: "University of Technology and Applied Sciences", category: "international-academic", logoSrc: "./images/international-partners/UTAS.png", url: "" },

  // --- INTERNATIONAL INDUSTRY PARTNERS ---
  { name: "Aptimizer", category: "international-industry", logoSrc: "./images/international-partners/Aptimizer.png", url: "" },
  { name: "Global Peace Foundation", category: "international-industry", logoSrc: "./images/international-partners/Global-Peace.png", url: "" },
  { name: "International Society of Teachers, Administrators and Researchers Inc.", category: "international-industry", logoSrc: "./images/international-partners/ISTAR.png", url: "" },

  // --- MEMBERSHIPS ---
  { name: "3ZERO", category: "membership", logoSrc: "./images/membership/3zero.png", url: "" },
  { name: "ATENEO-EEC", category: "membership", logoSrc: "./images/membership/EEC.png", url: "" },
  { name: "Global School Alliance", category: "membership", logoSrc: "./images/membership/GSA.png", url: "" },
  { name: "Global University Network for Innovation", category: "membership", logoSrc: "./images/membership/GUNI.png", url: "" },
  { name: "Sustainable Development Solutions Network", category: "membership", logoSrc: "./images/membership/SDSN.png", url: "" },
  { name: "The SDG Accord", category: "membership", logoSrc: "./images/membership/SDG_Accord.png", url: "" },
  { name: "United Nations Academic Impact", category: "membership", logoSrc: "./images/membership/UN-AcademicImpact.png", url: "" }
];

/**
 * UCU Global Reach - Countries Represented
 */
window.UCU_COUNTRIES = [
  "Philippines", "Turkey", "Bangladesh", "Indonesia", "Japan", "Oman", "South Korea", 
  "Thailand", "Taiwan", "Vietnam", "Malaysia", "China", 
  "Bosnia and Herzegovina", "United Kingdom", "Switzerland", "Poland", "Germany", 
  "USA", "Canada", "India", "France", "Spain"
];