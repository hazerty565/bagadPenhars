import type { Lang } from '$lib/i18n';
import type { ArticleSection, PublicArticle } from '$lib/types';

/**
 * Actualités provisoires du site public.
 *
 * Les articles ci-dessous sont des contenus de démonstration : ils ne
 * proviennent pas de la base et ne décrivent aucun événement réel. Ils
 * permettent de valider la page Actualités et l’aperçu des trois derniers
 * articles de l’accueil. Dès que la table `articles` sera branchée sur Neon,
 * `publishedArticles()` et `articleBySlug()` seront remplacés par les requêtes
 * serveur sans modifier les composants.
 *
 * Les photographies utilisées sont déjà publiques et présentes dans `static/`.
 */

interface LocalizedArticle {
	slug: string;
	date: string; // YYYY-MM-DD
	image: string;
	imageAlt: Record<Lang, string>;
	category: Record<Lang, string>;
	title: Record<Lang, string>;
	excerpt: Record<Lang, string>;
	content: Record<Lang, ArticleSection[]>;
}

const ARTICLES: LocalizedArticle[] = [
	{
		slug: 'retour-championnat-bagadou-2026',
		date: '2026-11-08',
		image: '/IMG_0877.webp',
		imageAlt: {
			fr: 'Sonneurs et batteurs du Bagad Penhars sur scène',
			en: 'Bagad Penhars pipers and drummers on stage',
			br: 'Sonerien ha taboulinoù Bagad Penhars war al leurenn'
		},
		category: {
			fr: 'Concours',
			en: 'Competition',
			br: 'Kenstrivadeg'
		},
		title: {
			fr: 'Retour sur le championnat des bagadoù',
			en: 'Looking back at the bagad championship',
			br: 'Distro ar c’hampionad bagadoù'
		},
		excerpt: {
			fr: 'Une saison régulière conclue à la quatrième place en première catégorie. Merci aux sonneurs, aux batteurs et au public venu nombreux.',
			en: 'A steady season rounded off with fourth place in the first category. Thanks to the pipers, the drummers and the crowd who came along.',
			br: 'Ur bloavezh stabil echuet er pevare plas er rummad kentañ. Trugarez d’ar sonerien, d’an taboulinoù ha d’an dud a oa deuet.'
		},
		content: {
			fr: [
				{
					heading: 'Une saison de travail',
					paragraphs: [
						'Le rideau est tombé sur le championnat des bagadoù. Après plusieurs mois de répétitions, le Bagad Penhars termine la saison à la quatrième place de la première catégorie, avec une suite particulièrement applaudie par le public.',
						'Ce résultat récompense un travail collectif mené depuis la rentrée : mise en place des pupitres, choix du répertoire, répétitions supplémentaires et préparation des déplacements. Les plus jeunes ont pris une part active à l’aventure.'
					]
				},
				{
					heading: 'Merci à celles et ceux qui ont œuvré',
					paragraphs: [
						'Le bureau remercie les sonneurs, les batteurs, les encadrants et les bénévoles qui ont accompagné le groupe tout au long de l’année. Merci également au public venu nombreux soutenir le bagad.',
						'Les répétitions reprennent dès la semaine prochaine. Le programme de la prochaine saison sera présenté aux membres lors de l’assemblée de décembre.'
					]
				}
			],
			en: [
				{
					heading: 'A season of hard work',
					paragraphs: [
						'The bagad championship is over. After several months of rehearsals, Bagad Penhars finishes the season in fourth place in the first category, with a suite that drew long applause from the audience.',
						'The result rewards a collective effort begun at the start of the school year: section work, choice of repertoire, extra rehearsals and travel preparation. The youngest players took an active part in the adventure.'
					]
				},
				{
					heading: 'Thanks to everyone involved',
					paragraphs: [
						'The committee thanks the pipers, drummers, tutors and volunteers who supported the group throughout the year. Thanks also to the audience who came in numbers to cheer the bagad on.',
						'Rehearsals resume next week. The programme for the coming season will be presented to members at the December meeting.'
					]
				}
			],
			br: [
				{
					heading: 'Ur bloavezh labour',
					paragraphs: [
						'Echu eo ar c’hampionad bagadoù. Goude meur a viz a adalennoù, Bagad Penhars a echue ar bloavezh er pevare plas er rummad kentañ, gant ur suitenn a voe tonet-mat gant an dud.',
						'Ar mont e-barzh a ro ur priz d’ul labour a-stroll boulc’het abaoe distro ar skol : labour ar pupitroù, dibab ar repertouar, adalennoù ouzhpenn ha prientiñ an tammoù-hent. Ar re yaouankañ o deus kemeret perzh en avantur.'
					]
				},
				{
					heading: 'Trugarez d’an holl',
					paragraphs: [
						'An ti-kêr a drugareka ar sonerien, an taboulinoù, ar c’helennerien hag ar youlidi o deus heuliet ar strollad e-pad ar bloavezh. Trugarez ivez d’an dud deuet niverus da harpañ ar bagad.',
						'Adalennoù a grog adarre ar sizhun a zeu. Program ar bloavezh a zeu a vo kinniget d’an izili e-pad bodadeg miz Kerzu.'
					]
				}
			]
		}
	},
	{
		slug: 'fest-noz-fin-de-saison-2026',
		date: '2026-10-25',
		image: '/groupe_bagad.webp',
		imageAlt: {
			fr: 'Le Bagad Penhars réuni en formation complète',
			en: 'Bagad Penhars gathered in full formation',
			br: 'Bagad Penhars bodet en ur stummadur klok'
		},
		category: {
			fr: 'Vie du bagad',
			en: 'Bagad life',
			br: 'Buhez ar bagad'
		},
		title: {
			fr: 'Un fest-noz pour clore la saison',
			en: 'A fest-noz to close the season',
			br: 'Ur fest-noz evit klozañ ar bloavezh'
		},
		excerpt: {
			fr: 'Plus de trois cents danseurs ont répondu présent pour fêter la fin de saison avec le bagad et ses invités.',
			en: 'More than three hundred dancers turned out to celebrate the end of the season with the bagad and its guests.',
			br: 'Ouzhpenn tri c’hant dañser o deus respontet evit lidañ dibenn ar bloavezh gant ar bagad hag e vignoned.'
		},
		content: {
			fr: [
				{
					heading: 'La fête avant tout',
					paragraphs: [
						'Le fest-noz de fin de saison a rassemblé plus de trois cents danseurs. Le bagad a ouvert la soirée avant de laisser la scène aux couples de sonneurs invités et aux groupes de chants.',
						'Les danseurs ont enchaîné gavottes, plinn et cercle circassien jusque tard dans la nuit, dans une salle transformée pour l’occasion.'
					]
				},
				{
					heading: 'Une organisation collective',
					paragraphs: [
						'L’événement a mobilisé une trentaine de bénévoles pour l’accueil, la buvette et le rangement. Le bureau remercie chaleureusement toutes les personnes qui ont donné de leur temps.',
						'Les bénéfices de la soirée contribueront au financement des déplacements et des cours de la prochaine saison.'
					]
				}
			],
			en: [
				{
					heading: 'A night for dancing',
					paragraphs: [
						'The end-of-season fest-noz brought together more than three hundred dancers. The bagad opened the evening before handing the stage over to guest piping duos and singing groups.',
						'Dancers kept going through gavottes, plinn and circle dances late into the night in a hall specially laid out for the occasion.'
					]
				},
				{
					heading: 'A team effort',
					paragraphs: [
						'Around thirty volunteers looked after the welcome desk, the bar and the clear-up. The committee warmly thanks everyone who gave their time.',
						'Proceeds from the evening will help fund travel and classes next season.'
					]
				}
			],
			br: [
				{
					heading: 'Ar gouel da gentañ',
					paragraphs: [
						'Fest-noz dibenn ar bloavezh en deus bodet ouzhpenn tri c’hant dañser. Ar bagad en deus digoret ar veureadenn a-raok leuskel al leurenn d’ar c’houbladoù sonerien pedet ha d’ar strolladoù kan.',
						'An dañserien o deus heuliet gavotennoù, plinn ha kelc’hioù betek diwezhat er noz, en ur sal a oa bet aozaet evit an degouezh.'
					]
				},
				{
					heading: 'Ur vignoniezh a-stroll',
					paragraphs: [
						'An degouezh en deus lakaet war droad ur pemzek bennak a youlidi evit degemer, ar c’hevredigezh hag ar renkañ. An ti-kêr a drugareka kalonek an holl dud o deus roet o amzer.',
						'Gounidoù ar veureadenn a sikouro da baeañ an tammoù-hent ha kentelioù ar bloavezh a zeu.'
					]
				}
			]
		}
	},
	{
		slug: 'nouveaux-sonneurs-2026',
		date: '2026-10-12',
		image: '/IMG_0881.webp',
		imageAlt: {
			fr: 'Membres du Bagad Penhars répétant les rudiments de percussion',
			en: 'Bagad Penhars members rehearsing percussion rudiments',
			br: 'Izili Bagad Penhars o tastum diazezoù an taboulin'
		},
		category: {
			fr: 'Vie du bagad',
			en: 'Bagad life',
			br: 'Buhez ar bagad'
		},
		title: {
			fr: 'Les nouveaux sonneurs ont fait leur entrée',
			en: 'New players join the group',
			br: 'An sonerien nevez o deus graet o monedigezh'
		},
		excerpt: {
			fr: 'Ils étaient sept à rejoindre le bagad cette année. Entre cours hebdomadaires et premières sorties, ils racontent leurs débuts.',
			en: 'Seven new players joined the bagad this year. Between weekly lessons and first outings, they share how it all began.',
			br: 'Seizh a zo deuet e-barzh ar bagad ar bloavezh-mañ. Etre kentelioù sizhuniek hag ermaeziadoù kentañ, e kontont o deroù.'
		},
		content: {
			fr: [
				{
					heading: 'Un passage en douceur',
					paragraphs: [
						'Sept nouvelles musiciennes et nouveaux musiciens ont rejoint le Bagad Penhars à la rentrée. Après plusieurs mois de cours, ils ont pu participer à leurs premières répétitions avec le groupe complet.',
						'Les parrains et marraines de chaque pupitre ont accompagné les arrivants : choix de l’instrument, travail des gammes, découverte du répertoire et préparation des tenues.'
					]
				},
				{
					heading: 'Déjà sur scène',
					paragraphs: [
						'Certains ont retrouvé le groupe sur scène pour la fin de saison. Une première expérience inoubliable, entre trac et fierté, que les aînés ont pris plaisir à partager.',
						'Les cours restent ouverts toute l’année pour les débutants. Il suffit de nous contacter pour venir essayer un instrument.'
					]
				}
			],
			en: [
				{
					heading: 'A gentle start',
					paragraphs: [
						'Seven new musicians joined Bagad Penhars at the start of the school year. After several months of lessons, they were able to take part in their first rehearsals with the full group.',
						'Each section paired newcomers with experienced players: choosing an instrument, working on scales, discovering the repertoire and preparing the uniform.'
					]
				},
				{
					heading: 'Already on stage',
					paragraphs: [
						'Some of them joined the group on stage at the end of the season. A first experience they will not forget, between nerves and pride, which the older members were delighted to share.',
						'Lessons stay open all year for beginners. Just get in touch to come and try an instrument.'
					]
				}
			],
			br: [
				{
					heading: 'Ur pennad mat',
					paragraphs: [
						'Seizh soner ha sonerez nevez o deus kemeret perzh e Bagad Penhars e distro ar skol. Goude meur a viz kentelioù, o deus gallet kemer perzh en o adalennoù kentañ gant ar strollad klok.',
						'An tadou ha mammou koublad evit pep pupitr o deus heuliet ar re nevez : dibab an instrument, labour ar skeulioù, dizoloadenn ar repertouar ha prientiñ ar gwiskamantoù.'
					]
				},
				{
					heading: 'War al leurenn dija',
					paragraphs: [
						'Lod anezho o deus adkavet ar strollad war al leurenn evit dibenn ar bloavezh. Ur bezañs kentañ dic’hanennel, etre aon ha lorc’h, a voe rannet gant ar re goshañ gant plijadur.',
						'Ar c’hentelioù a chom digor e-pad ar bloavezh evit ar re nevez. Trawalc’h eo deomp mont e darempred evit dont da esaeañ un instrument.'
					]
				}
			]
		}
	},
	{
		slug: 'enregistrement-nouvel-album',
		date: '2026-09-28',
		image: '/hero.webp',
		imageAlt: {
			fr: 'Le Bagad Penhars jouant en plein air',
			en: 'Bagad Penhars performing outdoors',
			br: 'Bagad Penhars o seniñ en diavaez'
		},
		category: {
			fr: 'Musique',
			en: 'Music',
			br: 'Sonerezh'
		},
		title: {
			fr: 'Un nouvel album enregistré à Quimper',
			en: 'A new album recorded in Quimper',
			br: 'Ur bladenn nevez enrollet e Kemper'
		},
		excerpt: {
			fr: 'Le bagad a passé une semaine en studio pour enregistrer les suites de la saison. Sortie prévue au printemps.',
			en: 'The bagad spent a week in the studio recording this season’s suites. Release planned for spring.',
			br: 'Ar bagad en deus tremenet ur sizhun er studio o enrollañ suitennoù ar bloavezh. Embannet e vo er goañv.'
		},
		content: {
			fr: [
				{
					heading: 'Une semaine en studio',
					paragraphs: [
						'Pendant une semaine, le bagad s’est installé dans un studio quimpérois pour enregistrer les suites travaillées cette saison. L’occasion de fixer le son du groupe et de garder une trace du répertoire actuel.',
						'Le travail a été mené pupitre par pupitre avant les prises d’ensemble, avec un soin particulier apporté aux équilibres entre bombardes, cornemuses et percussions.'
					]
				},
				{
					heading: 'Une sortie au printemps',
					paragraphs: [
						'Le disque devrait paraître au printemps, accompagné d’une présentation publique. Les membres seront informés en avant-première des modalités de commande.',
						'Ce projet a pu voir le jour grâce au soutien des partenaires du bagad et à la mobilisation des bénévoles.'
					]
				}
			],
			en: [
				{
					heading: 'A week in the studio',
					paragraphs: [
						'For a week the bagad moved into a studio in Quimper to record the suites worked on this season. A chance to capture the group’s sound and keep a record of the current repertoire.',
						'The work was done section by section before full ensemble takes, with particular care given to the balance between bombards, bagpipes and percussion.'
					]
				},
				{
					heading: 'Out in spring',
					paragraphs: [
						'The album is due for release in spring, with a public launch. Members will be told first how to order a copy.',
						'The project was made possible by the bagad’s partners and the commitment of its volunteers.'
					]
				}
			],
			br: [
				{
					heading: 'Ur sizhun er studio',
					paragraphs: [
						'E-pad ur sizhun eo bet ar bagad en ur studio e Kemper evit enrollañ ar suitennoù labourer e-pad ar bloavezh. Un dro vat da bakañ son ar strollad ha da virout ur roud eus ar repertouar a-vremañ.',
						'Graet eo bet al labour pupitr ha pupitr a-raok an enrolladennoù a-stroll, gant evezh ouzh ar c’hempouez etre bombard, biniou bras ha taboulinoù.'
					]
				},
				{
					heading: 'Embannet er goañv',
					paragraphs: [
						'Ar bladenn a dlefe dont er-maez er goañv, gant ur ginnigadenn publik. An izili a vo kelaouet da gentañ eus an doare da urzhiañ.',
						'Ar raktres en deus gellet bezañ graet a-drugarez da harp kevredidi ar bagad ha da youl ar youlidi.'
					]
				}
			]
		}
	},
	{
		slug: 'rentree-cours-2026',
		date: '2026-09-14',
		image: '/Formation_bombarde.webp',
		imageAlt: {
			fr: 'Cours de bombarde au Bagad Penhars',
			en: 'Bombarde lesson at Bagad Penhars',
			br: 'Kentel bombard e Bagad Penhars'
		},
		category: {
			fr: 'Formation',
			en: 'Learning',
			br: 'Stummadur'
		},
		title: {
			fr: 'Rentrée des cours : les inscriptions sont ouvertes',
			en: 'Classes are back: sign-ups are open',
			br: 'Distro ar c’hentelioù : digor eo an enskrivaduroù'
		},
		excerpt: {
			fr: 'Bombarde, cornemuse, caisse claire et percussion : les cours reprennent pour les débutants comme pour les confirmés.',
			en: 'Bombarde, bagpipes, snare drum and percussion: classes resume for beginners and experienced players alike.',
			br: 'Bombard, biniou bras, taboulin-snare ha percussionoù : adkregiñ a ra ar c’hentelioù evit ar re nevez evel evit ar re vourc’h.'
		},
		content: {
			fr: [
				{
					heading: 'Quatre pupitres, un même plaisir',
					paragraphs: [
						'Les cours du Bagad Penhars reprennent pour les quatre pupitres. Les débutants sont accueillis sans prérequis : l’instrument peut être prêté pour commencer, le temps de confirmer son choix.',
						'Les cours ont lieu chaque semaine à Quimper, en petits groupes, et sont encadrés par des musiciens bénévoles du bagad.'
					]
				},
				{
					heading: 'Comment s’inscrire',
					paragraphs: [
						'Il suffit d’écrire au bagad ou de venir nous rencontrer lors d’une répétition. Un essai gratuit est proposé avant toute inscription définitive.',
						'Un tarif familial est appliqué lorsque plusieurs membres d’un même foyer suivent les cours.'
					]
				}
			],
			en: [
				{
					heading: 'Four sections, one shared pleasure',
					paragraphs: [
						'Classes resume for all four sections of Bagad Penhars. Beginners are welcome with no prior experience: an instrument can be lent to get started while they make up their mind.',
						'Lessons take place every week in Quimper, in small groups, led by volunteer musicians from the bagad.'
					]
				},
				{
					heading: 'How to sign up',
					paragraphs: [
						'Simply write to the bagad or come and meet us at a rehearsal. A free trial is offered before any final registration.',
						'A family rate applies when several members of the same household take classes.'
					]
				}
			],
			br: [
				{
					heading: 'Pevar fupitr, ul laouenidigezh heñvel',
					paragraphs: [
						'Adkregiñ a ra kentelioù Bagad Penhars evit ar pevar fupitr. Degemeret eo ar re nevez hep pep rakverk : an instrument a c’hall bezañ prestet evit kregiñ, da c’hortoz kadarnaat o dibab.',
						'Bez’ e vez ar c’hentelioù bep sizhun e Kemper, e strolladoù bihan, renet gant sonerien youl eus ar bagad.'
					]
				},
				{
					heading: 'Penaos en em enskrivañ',
					paragraphs: [
						'Trawalc’h eo skrivañ d’ar bagad pe dont d’hor c’havout e-pad un adalenn. Un esañ digoust a vez kinniget a-raok pep enskrivadenn peurechuet.',
						'Ur priz familh a vez lakaet e pleustr pa heul meur a zen eus ar memes ti ar c’hentelioù.'
					]
				}
			]
		}
	},
	{
		slug: 'cornouaille-2026-merci',
		date: '2026-08-30',
		image: '/IMG_0880.webp',
		imageAlt: {
			fr: 'Joueuse de percussion devant la grosse caisse du Bagad Penhars',
			en: 'Percussionist in front of the Bagad Penhars bass drum',
			br: 'Taboulinerez dirak taboulin veur Bagad Penhars'
		},
		category: {
			fr: 'Festival',
			en: 'Festival',
			br: 'Gouel'
		},
		title: {
			fr: 'Cornouaille : merci à tous !',
			en: 'Cornouaille: thank you all!',
			br: 'Kornouaille : trugarez d’an holl !'
		},
		excerpt: {
			fr: 'Défilé, aubades et concert : le bagad a vécu une édition intense du festival de Cornouaille.',
			en: 'Parade, aubades and concert: the bagad enjoyed an intense edition of the Cornouaille festival.',
			br: 'Dibunadeg, aubadennoù ha sonadeg : ur bloavezhad kreñv eus gouel Kornouaille en deus bevet ar bagad.'
		},
		content: {
			fr: [
				{
					heading: 'Quatre jours de fête',
					paragraphs: [
						'Le festival de Cornouaille a une nouvelle fois rythmé la fin du mois d’août. Le bagad a participé au défilé, donné plusieurs aubades dans les rues de Quimper et clôturé la semaine par un concert très suivi.',
						'Les nouveaux membres ont pu découvrir l’ambiance du festival aux côtés des plus anciens, dans une ville entièrement tournée vers la culture bretonne.'
					]
				},
				{
					heading: 'Rendez-vous l’an prochain',
					paragraphs: [
						'Le bureau remercie le public, les organisateurs du festival et les bénévoles qui ont accompagné le groupe pendant ces quatre jours.',
						'Les dates de la prochaine édition seront annoncées par le festival. Le bagad y participera de nouveau avec plaisir.'
					]
				}
			],
			en: [
				{
					heading: 'Four days of celebration',
					paragraphs: [
						'The Cornouaille festival once again set the pace at the end of August. The bagad took part in the parade, played several aubades in the streets of Quimper and closed the week with a well-attended concert.',
						'New members discovered the atmosphere of the festival alongside the older ones, in a city given over to Breton culture.'
					]
				},
				{
					heading: 'See you next year',
					paragraphs: [
						'The committee thanks the audience, the festival organisers and the volunteers who supported the group over those four days.',
						'Dates for the next edition will be announced by the festival. The bagad will gladly take part again.'
					]
				}
			],
			br: [
				{
					heading: 'Pevar devezh gouel',
					paragraphs: [
						'Gouel Kornouaille en deus lakaet adarre lusk e dibenn miz Eost. Ar bagad en deus kemeret perzh en dibunadeg, sonet meur a aubadenn e straedoù Kemper ha klozet ar sizhun gant ur sonadeg a voe heuliet kalz.',
						'An izili nevez o deus dizoloet aergelc’h ar gouel e-kichen ar re goshañ, en ur gêr troet penn-da-benn ouzh sevenadur Breizh.'
					]
				},
				{
					heading: 'Betek ar bloavezh a zeu',
					paragraphs: [
						'An ti-kêr a drugareka an dud, aozerien ar gouel hag ar youlidi o deus heuliet ar strollad e-pad ar pevar devezh-se.',
						'Deiziadoù an embannadenn a zeu a vo embannet gant ar gouel. Ar bagad a gemero perzh ennañ en-dro gant plijadur.'
					]
				}
			]
		}
	}
];

function toPublic(article: LocalizedArticle, lang: Lang): PublicArticle {
	return {
		slug: article.slug,
		title: article.title[lang],
		excerpt: article.excerpt[lang],
		category: article.category[lang],
		date: article.date,
		image: article.image,
		imageAlt: article.imageAlt[lang],
		content: article.content[lang]
	};
}

/** Articles publiés, du plus récent au plus ancien. */
export function publishedArticles(lang: Lang): PublicArticle[] {
	return [...ARTICLES]
		.sort((a, b) => b.date.localeCompare(a.date))
		.map((article) => toPublic(article, lang));
}

/** Trois derniers articles publiés, pour l’aperçu de l’accueil. */
export function latestArticles(lang: Lang, limit = 3): PublicArticle[] {
	return publishedArticles(lang).slice(0, limit);
}

/** Un article par son slug, ou `undefined` s’il n’existe pas. */
export function articleBySlug(lang: Lang, slug: string): PublicArticle | undefined {
	const article = ARTICLES.find((item) => item.slug === slug);
	return article ? toPublic(article, lang) : undefined;
}
