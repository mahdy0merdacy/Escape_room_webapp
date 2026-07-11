import prisma from "@/lib/prisma";
import FaqManager from "./FaqManager";

export const dynamic = "force-dynamic";

const DEFAULT_FAQ: Omit<FaqItemRow, "id" | "createdAt" | "updatedAt">[] = [
  { order: 0, active: true, q_en: "What is an escape room?", q_fr: "Qu'est-ce qu'un escape room ?", q_ar: "ما هي غرفة الهروب؟", a_en: "An escape room is a physical adventure game where a group of players are locked in a themed room and must find clues, solve puzzles, and complete objectives to escape — all within 60 minutes. It's a fully immersive team experience.", a_fr: "Un escape room est un jeu d'aventure physique où un groupe de joueurs est enfermé dans une salle thématique et doit trouver des indices, résoudre des énigmes et remplir des objectifs pour s'échapper — le tout en 60 minutes. C'est une expérience d'équipe totalement immersive.", a_ar: "غرفة الهروب هي لعبة مغامرة حيث يُحبس مجموعة من اللاعبين في غرفة ذات ثيم معيّن ويجب عليهم إيجاد الأدلة وحل الألغاز لإفلاتهم — في 60 دقيقة فقط. إنها تجربة فريق مغمورة بالكامل." },
  { order: 1, active: true, q_en: "How many people can play?", q_fr: "Combien de personnes peuvent jouer ?", q_ar: "كم عدد الأشخاص الذين يمكنهم اللعب؟", a_en: "Our rooms accommodate between 2 and 7 players per session. For the best experience, we recommend groups of 4 to 5. Larger private groups can contact us to discuss exclusive bookings.", a_fr: "Nos salles accueillent entre 2 et 7 joueurs par session. Pour une expérience optimale, nous recommandons des groupes de 4 à 5 personnes. Les grands groupes privés peuvent nous contacter pour des réservations exclusives.", a_ar: "تستوعب غرفنا من 2 إلى 7 لاعبين للجلسة الواحدة. للحصول على أفضل تجربة، نوصي بمجموعات من 4 إلى 5 أشخاص. يمكن للمجموعات الخاصة الكبيرة التواصل معنا لحجوزات حصرية." },
  { order: 2, active: true, q_en: "How long does a session last?", q_fr: "Combien de temps dure une session ?", q_ar: "كم تستغرق الجلسة؟", a_en: "The game itself runs for 60 minutes. Please arrive 10 minutes early for a briefing from our game master. Total time at the venue — including briefing and debrief — is approximately 80 minutes.", a_fr: "Le jeu dure 60 minutes. Veuillez arriver 10 minutes avant pour le briefing avec notre maître du jeu. Le temps total au lieu — briefing et débriefing compris — est d'environ 80 minutes.", a_ar: "تستمر اللعبة 60 دقيقة. يرجى الوصول قبل 10 دقائق للاستماع إلى الإحاطة من مدير اللعبة. الوقت الإجمالي في المكان — بما في ذلك الإحاطة والإحاطة التالية — حوالي 80 دقيقة." },
  { order: 3, active: true, q_en: "Do I need experience to play?", q_fr: "Faut-il de l'expérience pour jouer ?", q_ar: "هل أحتاج إلى خبرة للعب؟", a_en: "Not at all. Our rooms are designed for all levels, from complete beginners to seasoned escape room veterans. Our staff will brief you thoroughly before you start, and you can request hints during the game if you get stuck.", a_fr: "Pas du tout. Nos salles sont conçues pour tous les niveaux, des débutants complets aux vétérans des escape rooms. Notre équipe vous briefera soigneusement avant le début, et vous pouvez demander des indices pendant le jeu.", a_ar: "لا على الإطلاق. غرفنا مصممة لجميع المستويات، من المبتدئين الكاملين إلى المحترفين. سيقدم موظفونا لك إحاطة شاملة قبل البدء، ويمكنك طلب تلميحات أثناء اللعبة." },
  { order: 4, active: true, q_en: "Is it suitable for children?", q_fr: "Est-ce adapté aux enfants ?", q_ar: "هل هي مناسبة للأطفال؟", a_en: "We recommend a minimum age of 13 due to the intensity of some rooms, particularly Annabelle which contains strong horror elements. Children under 13 must be accompanied by a parent or guardian.", a_fr: "Nous recommandons un âge minimum de 13 ans en raison de l'intensité de certaines salles, notamment Annabelle qui contient de forts éléments d'horreur. Les moins de 13 ans doivent être accompagnés d'un parent ou tuteur.", a_ar: "نوصي بالحد الأدنى من العمر 13 عاماً نظراً لشدة بعض الغرف، خاصة أناهيلي التي تحتوي على عناصر رعب قوية. يجب أن يرافق الأطفال دون 13 عاماً أحد الوالدين أو وصياً." },
  { order: 5, active: true, q_en: "How scary is Annabelle?", q_fr: "Annabelle est-elle très effrayante ?", q_ar: "ما مدى رعب غرفة أناهيلي؟", a_en: "Annabelle is our most intense horror experience — flickering lights, sound effects, moving props, and a deeply unsettling atmosphere. It is not recommended for people with severe anxiety, heart conditions, or a fear of the dark.", a_fr: "Annabelle est notre expérience d'horreur la plus intense — lumières vacillantes, effets sonores, accessoires animés et atmosphère profondément déstabilisante. Déconseillée aux personnes souffrant d'anxiété sévère, de problèmes cardiaques ou de claustrophobie.", a_ar: "أناهيلي هي أكثر تجاربنا المرعبة كثافةً — أضواء متقلبة، مؤثرات صوتية، إكسسوارات متحركة، وجو مقلق للغاية. غير موصى بها لمن يعانون من قلق شديد أو أمراض قلبية أو خوف من الظلام." },
  { order: 6, active: true, q_en: "What languages do you offer?", q_fr: "Quelles langues proposez-vous ?", q_ar: "ما اللغات التي تقدمونها؟", a_en: "We offer the full experience in French, Arabic, and English. Just let us know your preference when booking and our game master will guide you in your chosen language.", a_fr: "Nous proposons l'expérience complète en français, arabe et anglais. Indiquez simplement votre préférence lors de la réservation et notre maître du jeu vous guidera dans votre langue.", a_ar: "نقدم التجربة الكاملة بالفرنسية والعربية والإنجليزية. فقط أخبرنا بتفضيلاتك عند الحجز وسيرشدك مدير اللعبة بلغتك." },
  { order: 7, active: true, q_en: "Where are you located?", q_fr: "Où êtes-vous situés ?", q_ar: "أين تقعون؟", a_en: "We're in Manouba, Tunisia — easily accessible from Tunis, La Marsa, Ariana, and Bardo. Free parking is available on site.", a_fr: "Nous sommes à Manouba, Tunisie — facilement accessible depuis Tunis, La Marsa, Ariana et Bardo. Parking gratuit disponible sur place.", a_ar: "نحن في منوبة، تونس — يسهل الوصول إلينا من تونس العاصمة والمرسى وأريانة وباردو. مواقف سيارات مجانية متاحة في الموقع." },
  { order: 8, active: true, q_en: "What are your opening hours?", q_fr: "Quels sont vos horaires d'ouverture ?", q_ar: "ما هي ساعات العمل لديكم؟", a_en: "We're open daily. Please check our contact page for the latest schedule as hours vary by season.", a_fr: "Nous sommes ouverts tous les jours. Consultez notre page contact pour les horaires à jour, qui varient selon les saisons.", a_ar: "نحن مفتوحون يومياً. يرجى التحقق من صفحة الاتصال للاطلاع على أحدث الجداول الزمنية لأن المواعيد تتغير حسب الموسم." },
  { order: 9, active: true, q_en: "How do I book?", q_fr: "Comment réserver ?", q_ar: "كيف يمكنني الحجز؟", a_en: "Browse our rooms, choose your date and time slot, fill in your details, and confirm — it takes less than two minutes. No payment required upfront.", a_fr: "Parcourez nos salles, choisissez votre date et votre créneau, renseignez vos informations et confirmez — moins de deux minutes. Aucun paiement requis à l'avance.", a_ar: "تصفح غرفنا، اختر تاريخك ووقت الحجز، أدخل بياناتك وأكّد — أقل من دقيقتين. لا يلزم دفع مسبق." },
  { order: 10, active: true, q_en: "Can I cancel or reschedule?", q_fr: "Puis-je annuler ou reporter ?", q_ar: "هل يمكنني الإلغاء أو إعادة الجدولة؟", a_en: "Yes. Please contact us at least 24 hours before your session. You can reach us by phone or WhatsApp at +216 28 720 530.", a_fr: "Oui. Veuillez nous contacter au moins 24 heures avant votre session. Vous pouvez nous joindre par téléphone ou WhatsApp au +216 28 720 530.", a_ar: "نعم. يرجى التواصل معنا قبل 24 ساعة على الأقل من جلستك. يمكنك الوصول إلينا عبر الهاتف أو واتساب على +216 28 720 530." },
  { order: 11, active: true, q_en: "What should I wear?", q_fr: "Que faut-il porter ?", q_ar: "ماذا أرتدي؟", a_en: "Comfortable clothing and closed-toe shoes are recommended. You don't need any special equipment — everything you need is in the room.", a_fr: "Des vêtements confortables et des chaussures fermées sont recommandés. Vous n'avez besoin d'aucun équipement particulier — tout ce dont vous avez besoin se trouve dans la salle.", a_ar: "يُنصح بارتداء ملابس مريحة وأحذية مغلقة. لا تحتاج إلى أي معدات خاصة — كل ما تحتاجه موجود في الغرفة." },
  { order: 12, active: true, q_en: "What happens if we don't escape in time?", q_fr: "Que se passe-t-il si l'on ne s'échappe pas à temps ?", q_ar: "ماذا يحدث إذا لم نهرب في الوقت المحدد؟", a_en: "No worries — most groups don't escape on their first try! Our game master will reveal the solution and walk you through what you missed. It's all part of the fun.", a_fr: "Pas de panique — la plupart des groupes n'y arrivent pas du premier coup ! Notre maître du jeu interviendra après les 60 minutes, révélera la solution et vous expliquera ce que vous avez manqué.", a_ar: "لا تقلق — معظم المجموعات لا تهرب في المحاولة الأولى! سيتدخل مدير اللعبة بعد 60 دقيقة ويكشف الحل ويشرح ما فاتكم. هذا كله جزء من المتعة." },
  { order: 13, active: true, q_en: "Can I organise a corporate event or birthday?", q_fr: "Peut-on organiser un événement d'entreprise ou un anniversaire ?", q_ar: "هل يمكنني تنظيم حدث شركات أو عيد ميلاد؟", a_en: "Absolutely. We host team-building sessions, birthday parties, and private group events. Contact us directly via phone or WhatsApp and we'll put together a custom package.", a_fr: "Absolument. Nous accueillons des team-buildings, des anniversaires et des événements privés. Contactez-nous directement par téléphone ou WhatsApp pour un package sur mesure.", a_ar: "بالتأكيد. نستضيف جلسات بناء الفريق وحفلات أعياد الميلاد والفعاليات الخاصة. تواصل معنا مباشرة عبر الهاتف أو واتساب وسنعدّ لك باقة مخصصة." },
];

export type FaqItemRow = {
  id: string;
  order: number;
  active: boolean;
  q_en: string; q_fr: string; q_ar: string;
  a_en: string; a_fr: string; a_ar: string;
  createdAt: Date;
  updatedAt: Date;
};

export default async function FaqAdminPage() {
  let items = await prisma.faqItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  }) as FaqItemRow[];

  if (items.length === 0) {
    await prisma.faqItem.createMany({ data: DEFAULT_FAQ });
    items = await prisma.faqItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }) as FaqItemRow[];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">FAQ Manager</h1>
      </div>
      <p className="text-white/40 text-sm mb-10">
        Questions are shown in order. Toggle active/inactive to hide items without deleting them.
        Each item supports English, French, and Arabic.
      </p>
      <FaqManager initialItems={items} />
    </div>
  );
}
