export type IndustryEditorial = {
  intro: string;
  focusAreas: Array<{
    title: string;
    description: string;
  }>;
  partner: {
    title: string;
    description: string;
    points: string[];
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const industryEditorialBySlug: Record<string, IndustryEditorial> = {
  avocatura: {
    intro:
      "În profesiile juridice, confidențialitatea nu este doar o preferință tehnică. Emailul, documentele, instrucțiunile de plată, accesul colaboratorilor și disponibilitatea serviciilor digitale trebuie tratate ca o singură suprafață de risc.",
    focusAreas: [
      {
        title: "Secret profesional și date confidențiale",
        description:
          "Reducem expunerea documentelor și corespondenței prin control de acces, MFA, hardening și o administrare clară a identităților și privilegiilor.",
      },
      {
        title: "Email și identitate de domeniu",
        description:
          "SPF, DKIM, DMARC, anti-spoofing și protecția conturilor reduc riscul ca un atacator să imite cabinetul, un partener sau un client într-un scenariu de phishing ori BEC.",
      },
      {
        title: "Website și servicii publice protejate",
        description:
          "WAF, protecție DDoS, patching și monitorizare pentru site-uri, formulare și aplicații publice care nu trebuie să devină un punct de intrare către restul organizației.",
      },
      {
        title: "GDPR și dovezi operaționale",
        description:
          "Conectăm măsurile tehnice la fluxurile reale de date și la documentația de privacy, astfel încât controalele să poată fi explicate și susținute cu dovezi.",
      },
    ],
    partner: {
      title: "Securitatea juridică nu funcționează bine ca un puzzle de furnizori",
      description:
        "Un furnizor pentru hosting, altul pentru email și intervenții ocazionale pentru securitate lasă frecvent goluri între responsabilități. Un program integrat pornește de la riscul cabinetului și leagă infrastructura, identitatea, protecția website-ului și conformitatea.",
      points: [
        "Un punct clar de responsabilitate pentru incidente și priorități",
        "Controale construite în jurul confidențialității și secretului profesional",
        "Documentație și evidence păstrate pe parcurs, nu reconstruite înainte de audit",
        "Assessment înainte de migrare sau schimbări majore, astfel încât să păstrăm ce funcționează deja",
      ],
    },
    faqs: [
      {
        question: "De ce ar avea nevoie un cabinet de un partener specializat dacă are deja suport IT?",
        answer:
          "Suportul IT și cyber security au obiective diferite. Putem lucra peste infrastructura și furnizorii existenți, începând cu un security assessment care arată unde există riscuri, ce trebuie păstrat și ce trebuie întărit, fără o migrare forțată.",
      },
      {
        question: "Ce zone sunt prioritare pentru un cabinet de avocatură sau notariat?",
        answer:
          "De regulă pornim de la email și identitate, conturile cu acces la documente, website-ul public, backup/recovery și fluxurile în care se procesează date personale ori instrucțiuni sensibile.",
      },
      {
        question: "Cum legați partea tehnică de GDPR?",
        answer:
          "Mapăm sistemele și fluxurile relevante, apoi asociem măsuri precum controlul accesului, autentificarea, logging-ul, backup-ul și protecția serviciilor publice cu riscurile și responsabilitățile documentate ale organizației.",
      },
      {
        question: "Trebuie schimbat hostingul pentru a începe?",
        answer:
          "Nu. Evaluăm mai întâi configurația actuală. Dacă hostingul poate fi întărit și operat în siguranță, nu există motiv să migrăm doar de dragul migrării; dacă există limitări structurale, prezentăm separat opțiunile și riscurile.",
      },
    ],
  },

  medical: {
    intro:
      "Clinicile și cabinetele medicale combină date sensibile, conturi de personal, formulare, programări și furnizori externi. Disponibilitatea și controlul accesului trebuie proiectate împreună cu privacy și recovery.",
    focusAreas: [
      {
        title: "Date privind sănătatea",
        description:
          "Datele privind sănătatea sunt categorii speciale de date în GDPR. Aplicăm măsuri tehnice proporționale: acces minim necesar, MFA, criptare unde este relevantă, logging și separarea responsabilităților.",
      },
      {
        title: "Programări și servicii online",
        description:
          "Protejăm website-urile, formularele și aplicațiile expuse cu WAF, rate limiting, hardening și monitorizare, reducând atât riscul de abuz, cât și riscul de indisponibilitate.",
      },
      {
        title: "Identity și acces al personalului",
        description:
          "Conturile personalului, colaboratorilor și furnizorilor sunt inventariate și întărite, cu accent pe MFA, acces privilegiat și revocarea rapidă a accesului care nu mai este necesar.",
      },
      {
        title: "Backup și incident readiness",
        description:
          "Recovery-ul este tratat ca un proces testabil, nu doar ca existența unei copii de rezervă. Definim ce trebuie restaurat, în ce ordine și cine ia deciziile în incident.",
      },
    ],
    partner: {
      title: "Un incident medical este simultan tehnic, operațional și de privacy",
      description:
        "Separarea completă între hosting, securitate și procesele de date poate încetini răspunsul exact când este nevoie de claritate. Programul nostru urmărește activele prioritare și responsabilitățile într-o singură imagine de risc.",
      points: [
        "Securitate pentru conturi, website și infrastructură în același plan",
        "Prioritizare în funcție de datele și serviciile care afectează activitatea clinicii",
        "Evidence și proceduri pentru incidente, audituri și revizuiri interne",
        "Măsuri proporționale pentru cabinete mici, clinici și organizații medicale mai complexe",
      ],
    },
    faqs: [
      {
        question: "De ce sunt datele medicale tratate diferit în programul de securitate?",
        answer:
          "Pentru că impactul unei expuneri poate fi ridicat, iar datele privind sănătatea au un regim special în GDPR. De aceea acordăm prioritate identității, accesului, logging-ului, serviciilor publice și recovery-ului care protejează aceste fluxuri.",
      },
      {
        question: "O clinică mică poate începe fără un proiect mare de transformare IT?",
        answer:
          "Da. Putem începe cu assessment-ul activelor expuse și al conturilor critice, apoi prioritizăm câteva măsuri cu impact mare înainte de orice proiect mai amplu de infrastructură sau conformitate.",
      },
      {
        question: "Cum abordați platformele de programări sau aplicațiile furnizate de terți?",
        answer:
          "Le includem în inventarul de risc și analizăm accesul, integrarea, domeniile, autentificarea și dependențele. Nu presupunem că un serviciu SaaS elimină responsabilitatea organizației asupra modului în care este configurat și folosit.",
      },
      {
        question: "Ce se întâmplă dacă avem deja furnizori separați pentru aplicații și hosting?",
        answer:
          "Nu este o problemă. Putem păstra furnizorii existenți și să construim controale, monitorizare și responsabilități în jurul lor. Schimbarea infrastructurii este recomandată doar dacă riscul sau limitările tehnice o justifică.",
      },
    ],
  },

  "institutii-publice": {
    intro:
      "Instituțiile publice au servicii vizibile, identități instituționale, date personale, furnizori și obligații de guvernanță. Cyber resilience, NIS2 readiness, GDPR și accesibilitatea digitală trebuie coordonate, nu tratate ca proiecte izolate.",
    focusAreas: [
      {
        title: "NIS2 readiness și guvernanță",
        description:
          "Ajutăm la inventarierea riscurilor, măsurilor, furnizorilor, incidentelor și dovezilor tehnice relevante pentru cerințele aplicabile, fără a prezenta tehnologia ca substitut pentru analiza juridică sau instituțională.",
      },
      {
        title: "Servicii publice expuse",
        description:
          "Website-uri și aplicații publice protejate prin WAF, DDoS protection, hardening, vulnerability management și proceduri de recovery adaptate criticității serviciului.",
      },
      {
        title: "Email și identitate instituțională",
        description:
          "DMARC, DKIM, SPF, MFA și controlul conturilor privilegiate reduc impersonarea, phishing-ul și accesul neautorizat la canalele oficiale de comunicare.",
      },
      {
        title: "Accesibilitate digitală",
        description:
          "Audităm și îmbunătățim experiența conform cerințelor de accesibilitate aplicabile și principiilor WCAG, integrând accesibilitatea în ciclul normal de operare al serviciilor digitale.",
      },
    ],
    partner: {
      title: "Furnizorii multipli au nevoie de o imagine comună a riscului",
      description:
        "O instituție poate avea separat hosting, dezvoltare, email, aplicații și suport. Problema apare când nimeni nu urmărește cap-coadă dependențele, accesul, vulnerabilitățile, responsabilitățile și răspunsul la incident.",
      points: [
        "Inventar comun pentru active, furnizori și responsabilități",
        "Security assessment și remediation tracking înainte de declarații de conformitate",
        "Incident readiness și evidence păstrate în mod continuu",
        "Accesibilitate, privacy și cyber security integrate în aceeași guvernanță digitală",
      ],
    },
    faqs: [
      {
        question: "ZebraByte poate garanta conformitatea NIS2 a unei instituții?",
        answer:
          "Nu prezentăm un serviciu tehnic drept garanție juridică. Putem sprijini NIS2 readiness prin assessment, risk management, măsuri tehnice, evidence, supplier visibility și incident readiness, iar cerințele juridice aplicabile trebuie validate în contextul instituției.",
      },
      {
        question: "Putem lucra peste contractele și furnizorii existenți?",
        answer:
          "Da. Modelul poate fi unul de evaluare și coordonare a controalelor, fără înlocuirea automată a furnizorilor. Important este să existe ownership, vizibilitate asupra riscului și un proces de remediere verificabil.",
      },
      {
        question: "Cum se leagă accesibilitatea de programul de securitate?",
        answer:
          "Sunt discipline distincte, dar ambele fac parte din calitatea și guvernanța unui serviciu public digital. Le putem opera în același program de inventar, testare, remediere și evidence, păstrând cerințele specifice fiecărei discipline.",
      },
      {
        question: "Care este un punct de start realist pentru o instituție?",
        answer:
          "Un assessment al serviciilor expuse, domeniilor, emailului, conturilor privilegiate, furnizorilor și procesului actual de incident. Rezultatul trebuie să fie un backlog prioritizat, nu doar o listă de vulnerabilități.",
      },
    ],
  },

  ecommerce: {
    intro:
      "În e-commerce, securitatea și disponibilitatea au impact direct asupra veniturilor. Checkout-ul, CMS-ul, conturile administrative, integrările de plată, emailul și furnizorii fac parte din aceeași suprafață de atac.",
    focusAreas: [
      {
        title: "Checkout și aplicația publică",
        description:
          "WAF, DDoS protection, bot management, vulnerability management și hardening pentru a reduce exploatarea vulnerabilităților și abuzul automatizat asupra magazinului.",
      },
      {
        title: "Vârfuri de trafic și disponibilitate",
        description:
          "Revizuim capacitatea, cache-ul, dependențele și recovery-ul înaintea campaniilor importante, astfel încât securitatea să nu devină un compromis făcut în perioadele de trafic ridicat.",
      },
      {
        title: "Conturi administrative și furnizori",
        description:
          "MFA, acces minim necesar, separarea rolurilor și revizuirea integrărilor reduc riscul ca un singur cont compromis să ofere control extins asupra magazinului.",
      },
      {
        title: "Plăți și reducerea suprafeței de risc",
        description:
          "Analizăm integrarea procesatorilor și fluxurile de checkout pentru a limita expunerea inutilă a datelor și pentru a păstra responsabilitățile tehnice clar separate între magazin și furnizorii de plăți.",
      },
    ],
    partner: {
      title: "Performanța, frauda și cyber security nu sunt probleme separate",
      description:
        "Un magazin poate pierde venit atât prin downtime, cât și prin compromiterea unui cont, bot abuse sau o integrare vulnerabilă. Programul trebuie construit în jurul călătoriei reale a comenzii și al dependențelor magazinului.",
      points: [
        "WAF și protecție DDoS fără a bloca inutil traficul legitim",
        "Review înainte de Black Friday, campanii și schimbări majore de platformă",
        "Hardening pentru conturi, CMS și integrări critice",
        "Backup și recovery planificate pentru revenire controlată după incident",
      ],
    },
    faqs: [
      {
        question: "Cum vă pregătiți pentru Black Friday sau alte vârfuri de trafic?",
        answer:
          "Analizăm din timp caching-ul, originea, dependențele, rate limiting-ul, protecția anti-bot și planul de recovery. Scopul este ca măsurile de securitate și performanță să fie testate înainte de eveniment, nu schimbate în grabă în ziua campaniei.",
      },
      {
        question: "ZebraByte procesează sau stochează datele de card ale magazinului?",
        answer:
          "Nu presupunem și nu recomandăm stocarea inutilă a datelor de card. Arhitectura trebuie să folosească procesatori de plată și integrări adecvate, iar noi ne concentrăm pe securitatea magazinului, a integrării, a conturilor și a infrastructurii pe care o controlăm.",
      },
      {
        question: "Ce tip de atac automatizat este relevant pentru un magazin online?",
        answer:
          "În funcție de magazin pot apărea credential stuffing, scraping agresiv, abuz de formulare și checkout, scanare de vulnerabilități sau trafic DDoS. Controalele trebuie calibrate pe comportamentul real al aplicației, nu doar activate generic.",
      },
      {
        question: "Este obligatoriu să migrăm pe hostingul ZebraByte?",
        answer:
          "Nu. Putem evalua și securiza o arhitectură existentă dacă platforma permite măsurile necesare. Secure managed hosting devine relevant când limitările operaționale, recovery-ul sau controlul infrastructurii justifică mutarea.",
      },
    ],
  },

  imobiliare: {
    intro:
      "Agențiile imobiliare depind de site-uri bogate în media, formulare, CRM-uri și email. Lead-urile, identitatea domeniului și conturile comerciale trebuie protejate fără a sacrifica viteza și experiența vizitatorului.",
    focusAreas: [
      {
        title: "Formulare și date de lead",
        description:
          "Protecție anti-abuz, validare, rate limiting și controlul accesului la datele colectate, cu o revizuire clară a integrărilor care trimit lead-urile către CRM sau alte servicii.",
      },
      {
        title: "Conținut media și performanță",
        description:
          "CDN, caching și optimizarea originii pentru cataloage de imagini și pagini bogate în media, fără a transforma performanța într-un motiv pentru eliminarea controalelor de securitate.",
      },
      {
        title: "Email și impersonare",
        description:
          "DMARC, DKIM, SPF și hardening-ul conturilor reduc riscul de mesaje false care imită agenția sau un agent în conversații despre documente și plăți.",
      },
      {
        title: "CRM și SaaS",
        description:
          "Revizuim accesul, MFA, rolurile și offboarding-ul pentru platformele unde se află lead-uri, istoricul conversațiilor și date comerciale.",
      },
    ],
    partner: {
      title: "Un site rapid nu este suficient dacă lead-urile și identitatea rămân expuse",
      description:
        "Abordarea corectă combină performanța cu protecția formularelor, a emailului, a CRM-ului și a conturilor. În acest fel o campanie reușită nu mărește simultan și riscul operațional.",
      points: [
        "Edge security și performanță calibrate pentru trafic și conținut media",
        "Protecția formularelor și a fluxului până la CRM",
        "Email/domain security pentru reducerea impersonării",
        "Assessment înainte de migrarea unui site sau a unui volum mare de conținut",
      ],
    },
    faqs: [
      {
        question: "De ce contează securitatea formularelor dacă site-ul este doar de prezentare?",
        answer:
          "Pentru o agenție, formularele sunt adesea punctul în care vizitatorul devine lead și unde datele intră în CRM sau email. Abuzul, vulnerabilitățile sau configurările greșite pot afecta atât datele, cât și procesele comerciale.",
      },
      {
        question: "Cum abordați un site cu mii de imagini și anunțuri?",
        answer:
          "Separăm problema de conținut de problema de securitate: optimizăm livrarea media prin cache/CDN și analizăm originea, aplicația și baza de date fără a presupune că o migrare este singura soluție.",
      },
      {
        question: "Putem verifica mai întâi site-ul și CRM-ul existente?",
        answer:
          "Da. Security assessment-ul este punctul potrivit pentru a identifica expunerea website-ului, domeniului, formularelor și conturilor înainte de a investi într-o schimbare de platformă.",
      },
      {
        question: "Cum reduceți riscul de impersonare a agenției?",
        answer:
          "Întărim autentificarea conturilor și configurăm mecanismele de autentificare a domeniului de email, apoi verificăm domeniile și canalele prin care clienții primesc comunicări oficiale.",
      },
    ],
  },

  horeca: {
    intro:
      "Restaurantele, hotelurile și operatorii HoReCa depind de rezervări, website, email, furnizori și conturi administrate de mai multe persoane. Sezonalitatea face ca disponibilitatea și recovery-ul să fie esențiale exact în perioadele cu presiune operațională maximă.",
    focusAreas: [
      {
        title: "Rezervări și formulare",
        description:
          "Protejăm formularele și aplicațiile de rezervare împotriva abuzului automatizat și a vulnerabilităților, urmărind și integrarea cu serviciile externe care procesează datele oaspeților.",
      },
      {
        title: "Trafic sezonier și DDoS",
        description:
          "CDN, caching, WAF și protecție DDoS configurate pentru a menține site-ul utilizabil în weekenduri, sărbători, evenimente și perioade de sezon.",
      },
      {
        title: "Conturi folosite de mai multe echipe",
        description:
          "Reducem parolele partajate, introducem MFA și clarificăm accesul la email, website, platforme de rezervări și alte conturi care se schimbă frecvent odată cu personalul.",
      },
      {
        title: "Email și comunicarea cu oaspeții",
        description:
          "Protejăm domeniul împotriva spoofing-ului și întărim conturile folosite pentru confirmări, furnizori și comunicarea operațională.",
      },
    ],
    partner: {
      title: "Sezonalitatea schimbă modul în care trebuie operată infrastructura",
      description:
        "Un sistem care funcționează bine într-o zi obișnuită poate ceda în cel mai valoros weekend al sezonului. De aceea tratăm capacity, security controls și recovery ca parte din același plan operațional.",
      points: [
        "Pregătire înaintea perioadelor de trafic cunoscute",
        "Protecția formularelor și conturilor care gestionează rezervări",
        "Actualizări și schimbări controlate, nu intervenții riscante în plin sezon",
        "Backup și recovery pregătite pentru restaurare, nu doar stocate pasiv",
      ],
    },
    faqs: [
      {
        question: "Cum pregătiți un site pentru sezon sau o perioadă cu multe rezervări?",
        answer:
          "Revizuim traficul, cache-ul, capacitatea originii, WAF-ul, rate limiting-ul, integrările și recovery-ul înainte de perioada critică. Schimbările importante sunt testate înainte, nu introduse în grabă în timpul vârfului.",
      },
      {
        question: "Ce date dintr-un formular de rezervare trebuie protejate?",
        answer:
          "Datele de contact și orice informații suplimentare colectate trebuie minimizate și accesate doar de persoanele și sistemele care au nevoie de ele. Analizăm atât formularul, cât și traseul datelor către email, CRM sau platforma de rezervări.",
      },
      {
        question: "Cum gestionați conturile atunci când personalul se schimbă des?",
        answer:
          "Recomandăm conturi individuale unde platforma permite, MFA, roluri minime și un proces simplu de onboarding/offboarding, pentru ca accesul fostului personal să nu rămână activ din inerție.",
      },
      {
        question: "Este suficient un plugin de securitate pentru un site de restaurant sau hotel?",
        answer:
          "Nu ca strategie completă. Un plugin poate fi un control util, dar riscul include și domeniul, emailul, infrastructura, conturile, furnizorii, backup-ul și configurația de la edge.",
      },
    ],
  },

  logistica: {
    intro:
      "Producția și logistica depind de ERP, tracking, acces remote, furnizori și identități distribuite. O compromitere poate opri procese operaționale, nu doar un website, astfel încât prioritățile trebuie definite după impactul asupra activității.",
    focusAreas: [
      {
        title: "Continuitate operațională",
        description:
          "Inventariem sistemele de care depind comenzile, stocurile, tracking-ul și schimbul de documente, apoi definim recovery și priorități de incident după impactul real asupra operațiunilor.",
      },
      {
        title: "Acces remote și conturi privilegiate",
        description:
          "MFA, segmentarea accesului, revizuirea privilegiilor și logging pentru conturile care pot modifica sisteme, infrastructură sau aplicații operaționale.",
      },
      {
        title: "Furnizori și supply-chain risk",
        description:
          "Urmărim accesul terților, integrările și dependențele externe pentru a reduce situațiile în care un furnizor compromis devine o cale directă către sistemele interne.",
      },
      {
        title: "NIS2 readiness unde se aplică",
        description:
          "Risk management, incident readiness, supplier visibility și evidence pot fi structurate pentru a susține cerințele NIS2 aplicabile organizației, fără a confunda implementarea tehnică cu validarea juridică.",
      },
    ],
    partner: {
      title: "Risc IT trebuie tradus în impact asupra producției și livrărilor",
      description:
        "Prioritatea nu este numărul de alerte, ci ce sisteme pot opri activitatea, ce acces ar permite o escaladare și cât de repede poate organizația reveni controlat după un incident.",
      points: [
        "Asset prioritization după impact operațional",
        "Identity și privileged-access controls pentru echipe distribuite",
        "Vulnerability management și hardening pentru serviciile expuse",
        "Incident response și recovery testate în jurul fluxurilor critice",
      ],
    },
    faqs: [
      {
        question: "Care este primul lucru pe care îl evaluați într-o companie de logistică sau producție?",
        answer:
          "Începem cu dependențele operaționale: ce sisteme susțin comenzile, tracking-ul, stocurile, accesul remote și schimbul cu furnizorii. Apoi evaluăm identitățile, expunerea externă, backup-ul și capacitatea de răspuns.",
      },
      {
        question: "Aveți nevoie de acces la rețele industriale sau OT pentru a începe?",
        answer:
          "Nu neapărat. Putem începe cu suprafața IT și serviciile expuse, identități, email, furnizori și procedurile de incident. Orice evaluare OT trebuie definită separat, cu scope, autorizație și metode adecvate mediului industrial.",
      },
      {
        question: "Cum abordați accesul furnizorilor și al echipelor din locații diferite?",
        answer:
          "Urmărim cine are acces, prin ce mecanism, cu ce privilegii și pentru cât timp. Obiectivul este acces minim necesar, MFA, logging și revocare controlată, nu acces permanent acordat pentru comoditate.",
      },
      {
        question: "Migrarea infrastructurii este obligatorie?",
        answer:
          "Nu. Mai întâi evaluăm riscurile și limitările actuale. O migrare are sens doar dacă reduce în mod măsurabil riscul, îmbunătățește recovery-ul sau rezolvă o limitare operațională care nu poate fi remediată în mediul existent.",
      },
    ],
  },

  educatie: {
    intro:
      "Școlile, universitățile și furnizorii educaționali gestionează conturi numeroase, date despre elevi și studenți, website-uri, LMS-uri și perioade cu trafic concentrat. Security, privacy și accessibility trebuie să permită educația, nu să o blocheze.",
    focusAreas: [
      {
        title: "Identități numeroase și schimbătoare",
        description:
          "MFA, lifecycle pentru conturi, roluri și revizuirea accesului reduc riscul creat de parole reutilizate, conturi vechi și permisiuni care rămân active după schimbarea rolurilor.",
      },
      {
        title: "Date despre elevi și studenți",
        description:
          "Aplicăm control de acces, minimizarea expunerii și logging acolo unde este relevant, conectând măsurile tehnice la fluxurile de date și cerințele de privacy ale instituției.",
      },
      {
        title: "Website și LMS",
        description:
          "Patching disciplinat, WAF, protecție DDoS, vulnerability management și backup pentru serviciile care trebuie să rămână disponibile în înscrieri, examene și perioade de activitate intensă.",
      },
      {
        title: "Accesibilitate digitală",
        description:
          "Audit și remediere conform cerințelor aplicabile și principiilor WCAG, astfel încât accesibilitatea să fie inclusă în design, conținut și procesele de publicare, nu doar într-un widget.",
      },
    ],
    partner: {
      title: "Un administrator IT nu ar trebui să fie singurul control de securitate",
      description:
        "Mediul educațional combină suport zilnic, conturi, aplicații SaaS, website-uri și obligații de privacy. Un program separat de security și compliance oferă procese și verificări pe care echipa internă le poate folosi fără a-i înlocui rolul.",
      points: [
        "Identity baseline și procese simple de onboarding/offboarding",
        "Website/LMS hardening și patching urmărite în mod repetabil",
        "Security, GDPR și accessibility coordonate fără amestecarea responsabilităților",
        "Recovery pregătit pentru serviciile care devin critice în anumite perioade",
      ],
    },
    faqs: [
      {
        question: "De ce nu este suficient administratorul IT intern?",
        answer:
          "Poate fi foarte bun pentru operarea zilnică, dar security assessment, monitoring, compliance evidence și accessibility sunt discipline suplimentare. Modelul nostru poate completa echipa internă, nu trebuie să o înlocuiască.",
      },
      {
        question: "Cum protejați conturile elevilor, studenților și personalului?",
        answer:
          "Începem cu inventarul identităților, MFA unde platformele permit, roluri și procese de revocare. Apoi prioritizăm conturile privilegiate și serviciile în care o compromitere ar avea impact mai mare.",
      },
      {
        question: "Accesibilitatea se rezolvă doar prin widget?",
        answer:
          "Nu. Un widget poate ajuta anumite nevoi de utilizare, dar conformitatea și accesibilitatea reală cer și structură semantică, navigare cu tastatura, contrast, formulare, conținut și testare. O tratăm ca proces de audit și remediere.",
      },
      {
        question: "Cum pregătiți serviciile pentru înscrieri sau examene?",
        answer:
          "Revizuim capacitatea, caching-ul, serviciile dependente, WAF-ul și recovery-ul înainte de perioadele critice și evităm schimbările majore nevalidate chiar înainte de vârful de utilizare.",
      },
    ],
  },

  ong: {
    intro:
      "ONG-urile lucrează adesea cu echipe mici, voluntari, servicii SaaS și bugete controlate, dar pot procesa date sensibile despre beneficiari, donatori și parteneri. Programul trebuie să reducă riscul fără birocrație inutilă.",
    focusAreas: [
      {
        title: "Date despre donatori și beneficiari",
        description:
          "Inventariem unde ajung datele din formulare, cine are acces și ce servicii SaaS le procesează, apoi aplicăm controale proporționale de acces, MFA, backup și protecție a serviciilor publice.",
      },
      {
        title: "Campanii și vârfuri de trafic",
        description:
          "Pregătim website-ul, formularele și infrastructura înaintea campaniilor importante prin caching, WAF, anti-abuse și recovery, fără a dimensiona permanent sistemele pentru cel mai rar vârf.",
      },
      {
        title: "Voluntari și acces temporar",
        description:
          "Procese simple de onboarding/offboarding, conturi individuale unde este posibil și revizuirea accesului reduc riscul lăsat de parole partajate și conturi care rămân active după încheierea colaborării.",
      },
      {
        title: "Evidence pentru parteneri și finanțatori",
        description:
          "Păstrăm assessment-uri, măsuri, responsabilități și remediere într-o formă care poate susține discuțiile cu partenerii, finanțatorii sau auditorii, fără afirmații de conformitate care nu au fost validate.",
      },
    ],
    partner: {
      title: "Securitatea trebuie să supraviețuiască schimbării voluntarilor și proiectelor",
      description:
        "Soluțiile ad-hoc pot funcționa până când persoana care le-a configurat nu mai este disponibilă. Un program simplu, documentat și repetabil păstrează ownership-ul în organizație și reduce dependența de cunoștințe informale.",
      points: [
        "Baseline realist pentru email, SaaS, website și backup",
        "MFA și ownership pentru conturile importante",
        "Pregătire înainte de campanii cu trafic și donații crescute",
        "Prioritizare după risc și buget, nu după numărul de produse de securitate disponibile",
      ],
    },
    faqs: [
      {
        question: "Putem avea securitate serioasă cu un buget limitat?",
        answer:
          "Da, dacă prioritizăm. Începem cu identitățile, emailul, website-ul, backup-ul și serviciile SaaS care conțin date importante, apoi extindem programul doar acolo unde riscul justifică investiția.",
      },
      {
        question: "Ce risc creează conturile folosite de voluntari?",
        answer:
          "Riscul principal este lipsa ownership-ului și accesul care rămâne activ după încheierea colaborării. Conturile individuale, MFA și un proces simplu de revocare reduc mult această problemă.",
      },
      {
        question: "Cum ne pregătim înainte de o campanie majoră?",
        answer:
          "Facem un review al website-ului, formularelor, domeniului de email, capacității, protecției anti-abuz și recovery-ului, apoi remediem problemele cu impact mare înainte de lansare.",
      },
      {
        question: "Trebuie să mutăm toate serviciile la ZebraByte?",
        answer:
          "Nu. Putem opera un program de securitate peste servicii SaaS și furnizori existenți, atâta timp cât avem suficientă vizibilitate și posibilitatea de a aplica măsurile necesare. Migrarea este o decizie tehnică, nu o condiție comercială.",
      },
    ],
  },
};

export function getIndustryEditorial(slug: string): IndustryEditorial | undefined {
  return industryEditorialBySlug[slug];
}
