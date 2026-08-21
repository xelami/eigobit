import "dotenv/config"

import { and, eq } from "drizzle-orm"

import { db } from "./index.js"
import { practiceQuestions, practiceQuestionOptions } from "./schema.js"

console.log("🌱 seed-practice.ts started")
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)

type QuestionOption = [string, string, boolean]

type QuestionVocabulary = {
  word: string
  meaning: string
  exampleSentence: string
}

type Question = {
  questionText: string
  explanation: string
  difficulty: "beginner"
  vocabulary: QuestionVocabulary[]
  options: QuestionOption[]
}

/*
 * ============================================================================
 * TOEIC PART 5 — BEGINNER QUESTIONS
 * ============================================================================
 */

const questions: Question[] = [
  // ---------------------------------------------------------------------------
  // VERB FORMS
  // ---------------------------------------------------------------------------

  {
    questionText: "The manager ______ the email yesterday.",
    explanation:
      "正解は「C. sent」です。文中の「yesterday」は「昨日」という過去の時点を表すため、この文では過去形を使う必要があります。「send」の過去形は「sent」です。\n\n「The manager sent the email yesterday.」で「そのマネージャーは昨日、そのメールを送りました」という意味になります。\n\nAの「send」は現在形または原形、Bの「sends」は三人称単数現在形、Dの「sending」は-ing形なので、「yesterday」と組み合わせて過去の出来事を表すことはできません。特に、主語が「The manager」であっても、過去形では「send」に-sを付けるのではなく、不規則変化の「sent」を使う点に注意しましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "manager",
        meaning: "管理職、マネージャー",
        exampleSentence: "The manager will meet with the team this afternoon.",
      },
      {
        word: "email",
        meaning: "メール",
        exampleSentence:
          "I received an important email from the client this morning.",
      },
    ],
    options: [
      ["A", "send", false],
      ["B", "sends", false],
      ["C", "sent", true],
      ["D", "sending", false],
    ],
  },

  {
    questionText: "The meeting will ______ at 10:00 a.m. tomorrow.",
    explanation:
      "正解は「A. begin」です。「will」は助動詞なので、willの直後には動詞の原形を置くというルールがあります。そのため、「will begin」が正しい形です。\n\n「The meeting will begin at 10:00 a.m. tomorrow.」は「会議は明日の午前10時に始まります」という意味です。\n\nBの「began」は過去形なので、willの後には置けません。Cの「beginning」は-ing形、Dの「begins」は三人称単数現在形であり、どちらもwillの後には使えません。\n\nTOEIC Part 5では、「will」「can」「must」「should」などの助動詞の後に動詞の原形を選ばせる問題がよく出ます。「助動詞＋動詞の原形」という形を覚えておきましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "meeting",
        meaning: "会議、打ち合わせ",
        exampleSentence: "The sales team has a meeting every Monday morning.",
      },
      {
        word: "begin",
        meaning: "始まる、始める",
        exampleSentence:
          "The presentation will begin after everyone takes their seats.",
      },
    ],
    options: [
      ["A", "begin", true],
      ["B", "began", false],
      ["C", "beginning", false],
      ["D", "begins", false],
    ],
  },

  {
    questionText: "Mr. Brown ______ to work by train every morning.",
    explanation:
      "正解は「B. travels」です。文中の「every morning」は「毎朝」という習慣を表しているため、現在形を使います。\n\n主語は「Mr. Brown」で、一人の男性を指す三人称単数です。そのため、現在形の動詞「travel」には三人称単数の-sを付けて「travels」とします。\n\n「Mr. Brown travels to work by train every morning.」は「ブラウンさんは毎朝、電車で通勤します」という意味です。\n\nAの「travel」は原形なので三人称単数の主語には使えません。Cの「traveling」は進行形などで使う-ing形、Dの「traveled」は過去形なので、「every morning」という現在の習慣とは合いません。\n\n「every day」「every morning」「usually」「often」など、習慣を表す語を見つけたら現在形を疑い、主語が三人称単数なら動詞の-sも確認しましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "travel",
        meaning: "移動する、旅行する",
        exampleSentence: "She travels to Osaka several times a month for work.",
      },
      {
        word: "every morning",
        meaning: "毎朝",
        exampleSentence: "He goes for a walk every morning before breakfast.",
      },
    ],
    options: [
      ["A", "travel", false],
      ["B", "travels", true],
      ["C", "traveling", false],
      ["D", "traveled", false],
    ],
  },

  {
    questionText: "All employees must ______ their identification cards.",
    explanation:
      "正解は「D. bring」です。「must」は助動詞なので、その直後には必ず動詞の原形を置きます。そのため、「must bring」が正しい組み合わせです。\n\n「All employees must bring their identification cards.」は「すべての従業員は身分証明書を持参しなければなりません」という意味です。\n\nAの「brings」は三人称単数現在形、Bの「brought」は過去形、Cの「bringing」は-ing形なので、「must」の後には使えません。\n\n「must」だけでなく、「will」「can」「may」「should」「could」などの助動詞の後も同じく動詞の原形になります。Part 5では、このルールだけで選択肢をかなり絞れることがあります。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "employee",
        meaning: "従業員、社員",
        exampleSentence: "Every employee must complete the training course.",
      },
      {
        word: "identification card",
        meaning: "身分証明書、IDカード",
        exampleSentence:
          "Please show your identification card at the entrance.",
      },
    ],
    options: [
      ["A", "brings", false],
      ["B", "brought", false],
      ["C", "bringing", false],
      ["D", "bring", true],
    ],
  },

  {
    questionText: "Ms. Green ______ at the company for five years.",
    explanation:
      "正解は「C. has worked」です。「for five years」は「5年間」という期間を表しています。この文では、Ms. Greenが過去に働き始め、その状態が現在まで続いていることを表しているため、現在完了形「has worked」が適切です。\n\n「Ms. Green has worked at the company for five years.」は「グリーンさんはその会社で5年間働いています」という意味になります。\n\n主語が「Ms. Green」で三人称単数なので、「have」ではなく「has」を使います。現在完了形は「have/has＋過去分詞」という形です。\n\nAの「works」は現在形なので「5年間ずっと」という過去から現在までの継続を明確に表せません。Bの「worked」は単純過去なので、現在まで続いていることを表すこの文には適していません。Dの「working」だけでは文の述語になりません。\n\n「for＋期間」「since＋開始時点」は現在完了形と一緒に使われることが多いので、Part 5では重要な目印になります。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "company",
        meaning: "会社",
        exampleSentence: "The company opened a new office in Kyoto last year.",
      },
      {
        word: "work",
        meaning: "働く、仕事をする",
        exampleSentence: "He has worked in the finance department since 2022.",
      },
    ],
    options: [
      ["A", "works", false],
      ["B", "worked", false],
      ["C", "has worked", true],
      ["D", "working", false],
    ],
  },

  {
    questionText:
      "The assistant ______ the documents before the meeting started.",
    explanation:
      "正解は「C. had prepared」です。この文には「the meeting started」という過去の出来事があります。そして、書類を準備したのは、その会議が始まるより前です。\n\n過去のある時点よりさらに前に完了していた出来事を表す場合、過去完了形「had＋過去分詞」を使います。そのため、「had prepared」が正解です。\n\n「The assistant had prepared the documents before the meeting started.」は「アシスタントは会議が始まる前に書類を準備していました」という意味です。\n\nBの「prepared」でも文法的に完全に不可能というわけではありませんが、この問題では「before the meeting started」という二つの過去の出来事の前後関係を明確にするため、過去完了形が最も適切です。Aの「prepares」は現在形、Dの「preparing」は-ing形なので文構造に合いません。\n\n「過去の出来事Aよりさらに前の出来事B」が出てきたら、Bに過去完了形を使う可能性を考えましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "assistant",
        meaning: "アシスタント、助手",
        exampleSentence:
          "The assistant arranged the documents on the manager's desk.",
      },
      {
        word: "document",
        meaning: "書類、文書",
        exampleSentence: "Please sign all of the documents before Friday.",
      },
      {
        word: "prepare",
        meaning: "準備する",
        exampleSentence: "We need to prepare a report for tomorrow's meeting.",
      },
    ],
    options: [
      ["A", "prepares", false],
      ["B", "prepared", false],
      ["C", "had prepared", true],
      ["D", "preparing", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // PREPOSITIONS
  // ---------------------------------------------------------------------------

  {
    questionText: "Please send the report ______ Friday.",
    explanation:
      "正解は「C. by」です。「by＋時点」は「その時点までに」「遅くともその時点までに」という締め切りを表します。\n\n「Please send the report by Friday.」は「金曜日までにレポートを送ってください」という意味です。金曜日より前に送ってもよく、金曜日中に送ってもよい、という「期限」のニュアンスがあります。\n\n「on Friday」なら「金曜日に」という特定の日を表し、「at Friday」は通常使いません。「from Friday」は「金曜日から」という開始点を表すため、締め切りの意味にはなりません。\n\nTOEICでは「by」と「until」の違いも重要です。「by Friday」は『金曜日までに完了する』という期限、「until Friday」は『金曜日まで継続する』という意味になりやすいので区別しましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "report",
        meaning: "報告書、レポート",
        exampleSentence:
          "The manager asked me to finish the report by tomorrow.",
      },
      {
        word: "deadline",
        meaning: "締め切り、期限",
        exampleSentence: "The deadline for the application is next Monday.",
      },
    ],
    options: [
      ["A", "at", false],
      ["B", "on", false],
      ["C", "by", true],
      ["D", "from", false],
    ],
  },

  {
    questionText: "The company has three offices ______ Tokyo.",
    explanation:
      "正解は「C. in」です。「in」は都市、国、地域などの比較的広い場所の中にあることを表すときに使います。そのため、「in Tokyo」が正しい表現です。\n\n「The company has three offices in Tokyo.」は「その会社は東京に3つのオフィスを持っています」という意味です。\n\nAの「at」は特定の地点や場所を指す場合に使われることが多く、「Tokyo」という都市そのものには通常「in」を使います。Bの「on」は通常、面・道路・階などを表します。Dの「to」は方向や移動先を示すため、「offices to Tokyo」では意味が合いません。\n\n場所の前置詞では、「in Tokyo」「in Japan」のように都市・国にはin、「at the station」「at the office」のように具体的な地点にはatを使う、という基本的な区別を覚えておきましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "office",
        meaning: "オフィス、事務所",
        exampleSentence: "Our main office is located near the station.",
      },
      {
        word: "location",
        meaning: "場所、所在地",
        exampleSentence: "The company is looking for a new office location.",
      },
    ],
    options: [
      ["A", "at", false],
      ["B", "on", false],
      ["C", "in", true],
      ["D", "to", false],
    ],
  },

  {
    questionText: "The store is closed ______ Sundays.",
    explanation:
      "正解は「C. on」です。曜日の前には基本的に「on」を使います。そのため、「on Sundays」が正しい表現です。\n\n「The store is closed on Sundays.」は「その店は毎週日曜日は休業しています」という意味です。\n\nここで「Sundays」と複数形になっているため、「毎週日曜日」という習慣的な意味になります。「on Sunday」なら特定の日曜日を指すことがあります。\n\nAの「at」は特定の時刻など、Bの「in」は月・年・長い期間など、Dの「by」は期限などを表すため、この文には合いません。\n\n「on Monday」「on Friday」「on weekends」のように、曜日や特定の日にはonを使うことを覚えておくと、Part 5の前置詞問題で素早く判断できます。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "store",
        meaning: "店、店舗",
        exampleSentence: "The store closes at eight o'clock every evening.",
      },
      {
        word: "closed",
        meaning: "閉まっている、営業していない",
        exampleSentence: "The restaurant is closed on public holidays.",
      },
    ],
    options: [
      ["A", "at", false],
      ["B", "in", false],
      ["C", "on", true],
      ["D", "by", false],
    ],
  },

  {
    questionText: "The conference begins ______ 9:30 a.m.",
    explanation:
      "正解は「C. at」です。「at」は特定の時刻を表すときに使います。そのため、「at 9:30 a.m.」が正しい表現です。\n\n「The conference begins at 9:30 a.m.」は「そのカンファレンスは午前9時30分に始まります」という意味です。\n\n時間の前置詞では、「at」は時刻、「on」は曜日・特定の日、「in」は月・年・季節など、という基本的な使い分けが重要です。\n\nAの「in」は「in July」「in 2026」のような比較的長い期間に使い、Bの「on」は「on Monday」「on May 5」のような日付に使います。Dの「by」は「9:30までに」という期限になってしまうため、開始時刻を表すこの文には適していません。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "conference",
        meaning: "会議、大会、カンファレンス",
        exampleSentence:
          "More than five hundred people attended the conference.",
      },
      {
        word: "begin",
        meaning: "始まる、始める",
        exampleSentence: "The ceremony will begin at noon.",
      },
    ],
    options: [
      ["A", "in", false],
      ["B", "on", false],
      ["C", "at", true],
      ["D", "by", false],
    ],
  },

  {
    questionText: "The new employee arrived ______ the office early.",
    explanation:
      "正解は「A. at」です。「arrive」は場所を表す語と一緒に使う場合、「arrive at＋比較的具体的な場所」という形を取ります。\n\n「The new employee arrived at the office early.」は「その新入社員は早くオフィスに到着しました」という意味です。\n\n「arrive at the office」「arrive at the station」「arrive at the airport」のように、駅・空港・オフィスなどの具体的な地点にはatを使います。一方、「arrive in Tokyo」「arrive in Japan」のように都市や国など比較的広い場所にはinを使います。\n\nBのonは場所の表面や道路など、Cのinは都市・国など、Dのtoは方向を表すことが多いですが、「arrive to」は標準的な英語では通常使いません。「arrive at/in」というセットで覚えると便利です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "new employee",
        meaning: "新入社員",
        exampleSentence: "The new employee started work on Monday.",
      },
      {
        word: "arrive",
        meaning: "到着する",
        exampleSentence:
          "Please arrive at the airport two hours before departure.",
      },
    ],
    options: [
      ["A", "at", true],
      ["B", "on", false],
      ["C", "in", false],
      ["D", "to", false],
    ],
  },

  {
    questionText: "The company has been operating ______ 2018.",
    explanation:
      "正解は「B. since」です。「since」は、ある動作や状態が始まった『起点』を表します。この文では「2018年から現在まで」という意味なので、「since 2018」が適切です。\n\n「The company has been operating since 2018.」は「その会社は2018年から営業を続けています」という意味です。\n\n「since」の後には「2018」「Monday」「last year」のような開始時点を置きます。一方、「for」の後には「five years」「three months」のような期間を置きます。\n\nAの「for」を使うなら「for eight years」のようになります。Cの「during」は「～の間に」という特定の期間中の出来事を表し、Dの「until」は「～まで」という終了時点を表すため、この文には合いません。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "operate",
        meaning: "運営する、営業する",
        exampleSentence:
          "The restaurant has operated in this area for more than ten years.",
      },
      {
        word: "since",
        meaning: "～以来、～から",
        exampleSentence: "She has lived in Tokyo since 2020.",
      },
    ],
    options: [
      ["A", "for", false],
      ["B", "since", true],
      ["C", "during", false],
      ["D", "until", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // ARTICLES / DETERMINERS
  // ---------------------------------------------------------------------------

  {
    questionText: "Ms. Lee is ______ employee in our department.",
    explanation:
      "正解は「B. an」です。「employee」は数えられる名詞で、ここでは単数形になっています。単数の可算名詞を1人・1つという意味で使う場合、基本的にaまたはanなどの限定詞が必要です。\n\nさらに「employee」は母音の音で始まるため、「a」ではなく「an」を使います。「an employee」が正しい組み合わせです。\n\n「Ms. Lee is an employee in our department.」は「リーさんは私たちの部署の社員です」という意味です。\n\nAの「a」は子音の音の前で使うためemployeeとは合いません。Cの「the」は特定の社員を指す場合に使うため、この文の一般的な説明には適していません。Dの「some」は通常、複数名詞や不可算名詞と組み合わせます。\n\n重要なのは、a/anの判断はスペルではなく『最初の音』で決まることです。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "employee",
        meaning: "従業員、社員",
        exampleSentence: "The company has over five hundred employees.",
      },
      {
        word: "department",
        meaning: "部署、部門",
        exampleSentence: "She works in the marketing department.",
      },
    ],
    options: [
      ["A", "a", false],
      ["B", "an", true],
      ["C", "the", false],
      ["D", "some", false],
    ],
  },

  {
    questionText: "We need ______ chairs for the meeting room.",
    explanation:
      "正解は「A. some」です。「chairs」は複数形の可算名詞で、「いくつかの椅子」という不特定の数量を表しているため、「some chairs」が適切です。\n\n「We need some chairs for the meeting room.」は「会議室にいくつか椅子が必要です」という意味です。\n\nBの「much」は通常、waterやmoneyのような不可算名詞に使います。「chair」は数えられるため「much chairs」とは言いません。Cの「anyone」は「誰か」という人を表す代名詞なので、chairを修飾できません。Dの「another」は「もう一つの」という意味で、通常は単数名詞と組み合わせるため「another chair」のように使います。\n\n「some＋複数可算名詞」「some＋不可算名詞」という基本パターンを覚えておきましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "chair",
        meaning: "椅子",
        exampleSentence: "Please move the chairs closer to the table.",
      },
      {
        word: "meeting room",
        meaning: "会議室",
        exampleSentence: "The meeting room is available after two o'clock.",
      },
    ],
    options: [
      ["A", "some", true],
      ["B", "much", false],
      ["C", "anyone", false],
      ["D", "another", false],
    ],
  },

  {
    questionText: "The company hired ______ new manager last month.",
    explanation:
      "正解は「A. a」です。「manager」は単数の可算名詞なので、前にa/an/theなどの限定詞が必要です。この文では新しいマネージャーについて初めて話しており、特定の人物としてまだ共有されていないため、「a new manager」が自然です。\n\n「The company hired a new manager last month.」は「その会社は先月、新しいマネージャーを1人採用しました」という意味です。\n\n「new」は子音の音で始まるため「an」ではなく「a」を使います。Bの「an」は母音の音の前で使うため不適切です。Cの「some」は通常複数名詞などと使い、Dの「many」も複数名詞を必要とするため、「manager」とは組み合わせられません。\n\nPart 5では、空欄の直後に単数可算名詞がある場合、a/an/theが必要かをまず確認すると効率的です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "hire",
        meaning: "雇う、採用する",
        exampleSentence:
          "The company plans to hire several engineers this year.",
      },
      {
        word: "manager",
        meaning: "管理職、マネージャー",
        exampleSentence: "The new manager has ten years of experience.",
      },
    ],
    options: [
      ["A", "a", true],
      ["B", "an", false],
      ["C", "some", false],
      ["D", "many", false],
    ],
  },

  {
    questionText: "Please contact ______ manager if you have any questions.",
    explanation:
      "正解は「C. the」です。ここでは「manager」が誰でもよいマネージャーではなく、文脈から特定できるマネージャーを指しています。そのため、定冠詞「the」を使います。\n\n「Please contact the manager if you have any questions.」は「質問があれば、そのマネージャーに連絡してください」という意味です。\n\nAの「a manager」なら「ある一人のマネージャー」という不特定の意味になります。Bの「an」はemployeeなど母音の音で始まる名詞の前に使うためmanagerとは合いません。Dの「some manager」はこの文脈では不自然です。\n\n「the」は『世界に一つしかないもの』だけでなく、『話し手と聞き手の間でどれを指しているか特定できるもの』にも使います。TOEICではこの「文脈上特定できる」という感覚が重要です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "contact",
        meaning: "連絡する",
        exampleSentence:
          "Please contact our customer service team if you need help.",
      },
      {
        word: "question",
        meaning: "質問、疑問",
        exampleSentence: "Please let me know if you have any questions.",
      },
    ],
    options: [
      ["A", "a", false],
      ["B", "an", false],
      ["C", "the", true],
      ["D", "some", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // WORD FORMS
  // ---------------------------------------------------------------------------

  {
    questionText: "The new restaurant is very ______ with local workers.",
    explanation:
      "正解は「B. popular」です。空欄の前にはbe動詞「is」があり、「very」は形容詞を修飾できます。この文ではrestaurantがどのような状態・評価なのかを説明する必要があるため、形容詞「popular」が適切です。\n\n「The new restaurant is very popular with local workers.」は「その新しいレストランは地元の会社員にとても人気があります」という意味です。\n\nAの「popularity」は名詞で「人気」、Cの「popularly」は副詞、Dの「popularize」は動詞なので、「is very ______」という文型には入りません。\n\nTOEICの品詞問題では、空欄の前後を見るだけで選択肢をかなり絞れます。「be動詞＋very＋空欄」の形なら、まず形容詞を疑いましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "restaurant",
        meaning: "レストラン、飲食店",
        exampleSentence: "This restaurant is popular with office workers.",
      },
      {
        word: "popular",
        meaning: "人気のある",
        exampleSentence: "The new café is popular among local residents.",
      },
    ],
    options: [
      ["A", "popularity", false],
      ["B", "popular", true],
      ["C", "popularly", false],
      ["D", "popularize", false],
    ],
  },

  {
    questionText: "The company announced the ______ of a new branch.",
    explanation:
      "正解は「C. opening」です。「the ______ of a new branch」という構造では、「the」と「of」の間に名詞が必要です。「opening」は名詞として「開店・開設・開業」という意味で使えるため、文法的にも意味的にも適切です。\n\n「The company announced the opening of a new branch.」は「その会社は新しい支店の開設を発表しました」という意味です。\n\nAの「open」は動詞または形容詞、Bの「openly」は副詞、Dの「opened」は過去形・過去分詞なので、この位置に必要な名詞として使えません。\n\n「the＋名詞＋of」という形はTOEICで非常によく出ます。空欄の前後に冠詞や前置詞がある場合、それによって必要な品詞を判断すると素早く解けます。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "announce",
        meaning: "発表する、知らせる",
        exampleSentence: "The company announced its plans for next year.",
      },
      {
        word: "branch",
        meaning: "支店、支社",
        exampleSentence: "The bank opened a new branch near the station.",
      },
      {
        word: "opening",
        meaning: "開店、開業、開設",
        exampleSentence: "The grand opening of the new store is next Saturday.",
      },
    ],
    options: [
      ["A", "open", false],
      ["B", "openly", false],
      ["C", "opening", true],
      ["D", "opened", false],
    ],
  },

  {
    questionText: "The manager spoke ______ during the meeting.",
    explanation:
      "正解は「B. clearly」です。空欄は動詞「spoke」を修飾しています。動詞を修飾して「どのように話したのか」を説明するには副詞が必要なので、「clearly」が正解です。\n\n「The manager spoke clearly during the meeting.」は「そのマネージャーは会議中、明確にはっきりと話しました」という意味です。\n\nAの「clear」は形容詞で、通常は名詞を説明したりbe動詞の後で補語になったりします。Cの「clarity」は名詞で「明瞭さ」、Dの「cleared」は動詞の過去形・過去分詞なので、この位置には適していません。\n\n「動詞＋空欄」という形で、空欄が動詞の動作の仕方を説明している場合は、副詞を選ぶ可能性が高くなります。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "clearly",
        meaning: "明確に、はっきりと",
        exampleSentence: "Please speak clearly during the presentation.",
      },
      {
        word: "result",
        meaning: "結果",
        exampleSentence: "The test results will be available tomorrow.",
      },
    ],
    options: [
      ["A", "clear", false],
      ["B", "clearly", true],
      ["C", "clarity", false],
      ["D", "cleared", false],
    ],
  },

  {
    questionText: "The company is looking for a ______ assistant.",
    explanation:
      "正解は「C. reliable」です。空欄は名詞「assistant」の前に置かれており、そのアシスタントがどのような人物なのかを説明しています。そのため、名詞を修飾する形容詞が必要です。\n\n「reliable」は「信頼できる、頼りになる」という意味の形容詞なので、「a reliable assistant」で「信頼できるアシスタント」という意味になります。\n\nAの「rely」は動詞「頼る」、Bの「reliably」は副詞「信頼できる形で」、Dの「reliability」は名詞「信頼性」です。どれもassistantを直接修飾する形容詞ではありません。\n\n名詞の直前の空欄では、まず形容詞が必要かどうかを確認しましょう。特に「a/an/the＋空欄＋名詞」という形は、形容詞の品詞問題で頻出します。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "reliable",
        meaning: "信頼できる、頼りになる",
        exampleSentence: "We need a reliable person to manage the project.",
      },
      {
        word: "assistant",
        meaning: "アシスタント、助手",
        exampleSentence: "The assistant helped prepare the presentation.",
      },
    ],
    options: [
      ["A", "rely", false],
      ["B", "reliably", false],
      ["C", "reliable", true],
      ["D", "reliability", false],
    ],
  },

  {
    questionText: "The manager was very ______ with the results.",
    explanation:
      "正解は「C. satisfied」です。「was very ______」という構造では、主語であるmanagerがどのような状態・感情だったのかを説明する形容詞が必要です。「satisfied」は『満足した、満足している』という感情を表す形容詞です。\n\n「The manager was very satisfied with the results.」は「そのマネージャーは結果にとても満足していました」という意味です。\n\nAの「satisfaction」は名詞「満足」、Bの「satisfy」は動詞「満足させる」、Dの「satisfying」は「満足させるような、満足感を与える」という意味です。\n\n「satisfied」と「satisfying」はTOEICでよく区別されます。「人が感じて満足している」ならsatisfied、「物事が人を満足させる」ならsatisfyingです。ここではmanager自身の感情なのでsatisfiedが適切です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "satisfied",
        meaning: "満足した、満足している",
        exampleSentence: "The customer was satisfied with the service.",
      },
      {
        word: "result",
        meaning: "結果",
        exampleSentence: "We were pleased with the final results.",
      },
    ],
    options: [
      ["A", "satisfaction", false],
      ["B", "satisfy", false],
      ["C", "satisfied", true],
      ["D", "satisfying", false],
    ],
  },

  {
    questionText: "The company needs an ______ worker for the position.",
    explanation:
      "正解は「B. experienced」です。空欄は名詞「worker」の前にあり、そのworkerがどのような人なのかを説明しているため、形容詞が必要です。「experienced」は「経験のある、経験豊富な」という意味の形容詞です。\n\n「The company needs an experienced worker for the position.」は「その会社はその職に経験のある人材を必要としています」という意味です。\n\nまた、「experienced」の前には「an」が使われています。これはexperiencedが母音の音で始まるためです。\n\nAの「experience」は名詞「経験」、Cの「experiencing」は-ing形、Dの「experientially」は副詞なので、この位置でworkerを修飾することはできません。\n\n「名詞の前＝形容詞」という基本パターンと、a/anの判断を同時に行う問題です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "experienced",
        meaning: "経験豊富な、経験のある",
        exampleSentence: "We are looking for an experienced designer.",
      },
      {
        word: "position",
        meaning: "職、役職、ポジション",
        exampleSentence: "She applied for a position in the sales department.",
      },
    ],
    options: [
      ["A", "experience", false],
      ["B", "experienced", true],
      ["C", "experiencing", false],
      ["D", "experientially", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // CONJUNCTIONS
  // ---------------------------------------------------------------------------

  {
    questionText: "The meeting was canceled ______ the manager was ill.",
    explanation:
      "正解は「A. because」です。後半の「the manager was ill」は、会議がキャンセルされた理由を説明しています。「because」は「～なので、～だから」という理由を導く接続詞です。\n\n「The meeting was canceled because the manager was ill.」は「マネージャーが病気だったので、会議はキャンセルされました」という意味です。\n\n「because」の後には通常、主語＋動詞を含む完全な文が続きます。ここでは「the manager was ill」という完全な節が続いているため、becauseが適切です。\n\nBの「although」は「～だけれども」という逆接、Cの「unless」は「～でない限り」という条件、Dの「while」は「～している間」または対比を表すため、理由を示すこの文には合いません。\n\n「because＋主語＋動詞」と「because of＋名詞」の違いも覚えておくと便利です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "cancel",
        meaning: "中止する、キャンセルする",
        exampleSentence:
          "The airline canceled the flight because of bad weather.",
      },
      {
        word: "ill",
        meaning: "病気の、具合が悪い",
        exampleSentence: "She was unable to come to work because she was ill.",
      },
    ],
    options: [
      ["A", "because", true],
      ["B", "although", false],
      ["C", "unless", false],
      ["D", "while", false],
    ],
  },

  {
    questionText: "Please call me ______ you arrive at the office.",
    explanation:
      "正解は「B. when」です。「when」は「～するとき、～したら」という時間を表す接続詞です。この文では、officeに到着した時点で電話をしてほしい、という意味になります。\n\n「Please call me when you arrive at the office.」は「オフィスに着いたら電話してください」という意味です。\n\nAの「because」は理由、Cの「although」は逆接、Dの「unless」は条件「～しない限り」を表すため、この文で必要な時間の意味を表せません。\n\nまた、「when you arrive」のように未来の出来事を表す時間節では、通常whenの後にwillを置かず現在形を使います。「when you arrive」が自然で、「when you will arrive」としない点も覚えておきましょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "arrive",
        meaning: "到着する",
        exampleSentence: "Please call me when you arrive at the hotel.",
      },
      {
        word: "office",
        meaning: "オフィス、事務所",
        exampleSentence: "Our office is closed on national holidays.",
      },
    ],
    options: [
      ["A", "because", false],
      ["B", "when", true],
      ["C", "although", false],
      ["D", "unless", false],
    ],
  },

  {
    questionText: "The store was busy, ______ we decided to wait outside.",
    explanation:
      "正解は「C. so」です。「so」は前に述べた状況を原因として、その結果として起こったことをつなぐ接続詞です。\n\nこの文では、「店が混雑していた」という状況があり、その結果として「私たちは外で待つことにした」となっています。そのため、「so」が適切です。\n\n「The store was busy, so we decided to wait outside.」は「店が混んでいたので、私たちは外で待つことにしました」という意味です。\n\nAの「but」は逆接、Bの「because」は理由を導く語、Dの「although」は「～だけれども」という逆接です。この文では前半が後半の理由・原因になっているため、結果を示す「so」が最も自然です。\n\n「because」と「so」はセットで考えると理解しやすく、「because」は理由側、「so」は結果側を導きます。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "busy",
        meaning: "忙しい、混雑した",
        exampleSentence: "The restaurant is usually busy on Friday evenings.",
      },
      {
        word: "decide",
        meaning: "決める、決定する",
        exampleSentence: "We decided to postpone the meeting until Monday.",
      },
    ],
    options: [
      ["A", "but", false],
      ["B", "because", false],
      ["C", "so", true],
      ["D", "although", false],
    ],
  },

  {
    questionText: "______ the weather was bad, the employees arrived on time.",
    explanation:
      "正解は「B. Although」です。「although」は「～だけれども」「～にもかかわらず」という逆接を表す接続詞です。\n\nこの文では、「天気が悪かった」という通常なら遅刻につながりそうな状況と、「従業員が時間通りに到着した」という予想に反する結果が対比されています。そのため「Although」が適切です。\n\n「Although the weather was bad, the employees arrived on time.」は「天気が悪かったにもかかわらず、従業員たちは時間通りに到着しました」という意味です。\n\nAの「Because」なら「天気が悪かったので、従業員たちは時間通りに到着した」という原因関係になり不自然です。Cの「So」は結果を表すため文頭のこの構造には合わず、Dの「And」は単純な追加を表すだけで逆接の意味がありません。\n\n「although」と「but」はどちらも逆接を表しますが、基本的に「Although A, B.」または「A, but B.」のように使い分けます。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "although",
        meaning: "～だけれども、～にもかかわらず",
        exampleSentence:
          "Although it was raining, the event continued as planned.",
      },
      {
        word: "employee",
        meaning: "従業員、社員",
        exampleSentence: "All employees must attend the annual training.",
      },
      {
        word: "on time",
        meaning: "時間通りに、定刻に",
        exampleSentence: "The train arrived on time despite the heavy rain.",
      },
    ],
    options: [
      ["A", "Because", false],
      ["B", "Although", true],
      ["C", "So", false],
      ["D", "And", false],
    ],
  },

  // ---------------------------------------------------------------------------
  // VOCABULARY
  // ---------------------------------------------------------------------------

  {
    questionText:
      "Employees should wear appropriate ______ during business meetings.",
    explanation:
      "正解は「A. attire」です。「attire」は「服装、衣装」という意味の名詞で、特に特定の場面に適した服装を表すときに使われます。\n\n「Employees should wear appropriate attire during business meetings.」は「従業員は仕事の会議では適切な服装をするべきです」という意味です。\n\n空欄の前には形容詞「appropriate」があり、その後には「during business meetings」が続いています。ここでは「appropriate」が修飾する名詞が必要なので、「attire」が文法的にも意味的にも適切です。\n\nBの「arrival」は「到着」、Cの「equipment」は「設備・機器」、Dの「scenery」は「景色」という意味で、服装を表しません。\n\n「attire」は「clothes」よりややフォーマルな語で、ビジネス・式典・職場などの文脈でよく使われます。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "attire",
        meaning: "服装、衣装",
        exampleSentence: "Formal attire is required for the awards ceremony.",
      },
      {
        word: "appropriate",
        meaning: "適切な、ふさわしい",
        exampleSentence: "Please wear appropriate clothing for the interview.",
      },
      {
        word: "business meeting",
        meaning: "仕事の会議、商談",
        exampleSentence:
          "She has a business meeting with an overseas client tomorrow.",
      },
    ],
    options: [
      ["A", "attire", true],
      ["B", "arrival", false],
      ["C", "equipment", false],
      ["D", "scenery", false],
    ],
  },

  {
    questionText: "Please make a ______ before visiting the doctor.",
    explanation:
      "正解は「A. appointment」です。「appointment」は、あらかじめ決められた時間に人と会うための『予約・約束』を意味します。医者に診てもらうための予約を表す場合、「make an appointment」という表現が非常によく使われます。\n\n「Please make an appointment before visiting the doctor.」は「医者を訪れる前に予約をしてください」という意味です。\n\nBの「application」は「申請・応募」、Cの「agreement」は「合意・契約」、Dの「announcement」は「発表・告知」という意味なので、医者の予約を表すことはできません。\n\n「make an appointment」「have an appointment」「cancel an appointment」などはビジネス英語や日常英語で頻出する組み合わせです。単語単体だけでなく、セット表現として覚えておくと使いやすくなります。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "appointment",
        meaning: "予約、約束",
        exampleSentence: "I have a doctor's appointment at three o'clock.",
      },
      {
        word: "visit",
        meaning: "訪問する、訪問",
        exampleSentence: "She plans to visit the client next week.",
      },
    ],
    options: [
      ["A", "appointment", true],
      ["B", "application", false],
      ["C", "agreement", false],
      ["D", "announcement", false],
    ],
  },

  {
    questionText: "The company will ______ a new product next month.",
    explanation:
      "正解は「A. launch」です。「launch」は新しい製品やサービスを市場に投入する、つまり『発売する・開始する』という意味の動詞です。\n\n「The company will launch a new product next month.」は「その会社は来月、新製品を発売します」という意味です。\n\n「will」の後なので、動詞は原形でなければなりません。その点でも「launch」が正しい形です。\n\nBの「borrow」は「借りる」、Cの「repair」は「修理する」、Dの「cancel」は「中止する」という意味なので、新製品を市場に出すという文脈には合いません。\n\n「launch a product」「launch a service」「launch a campaign」など、「launch＋新しいもの」という組み合わせはビジネス英語で非常によく使われます。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "launch",
        meaning: "発売する、開始する",
        exampleSentence:
          "The company plans to launch a new smartphone this fall.",
      },
      {
        word: "product",
        meaning: "製品、商品",
        exampleSentence:
          "The company developed a new product for small businesses.",
      },
    ],
    options: [
      ["A", "launch", true],
      ["B", "borrow", false],
      ["C", "repair", false],
      ["D", "cancel", false],
    ],
  },

  {
    questionText:
      "The manager asked the employee to ______ the report before Friday.",
    explanation:
      "正解は「A. complete」です。「complete」は「始めたものを最後まで終える、完成させる」という意味の動詞です。\n\nこの文では「ask＋人＋to＋動詞の原形」という構造になっています。「The manager asked the employee to complete the report.」で「マネージャーは社員にレポートを完成させるよう頼みました」という意味です。\n\n「complete the report」は『レポートを完成させる』という自然な組み合わせです。\n\nBの「invite」は「招待する」、Cの「attend」は「出席する」、Dの「replace」は「交換する・置き換える」という意味で、reportを完成させるという文脈には合いません。\n\nまた、「ask＋人＋to＋動詞」はTOEICで頻出する文型なので、「asked the employee to complete」のようにまとまりで理解するとよいでしょう。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "complete",
        meaning: "完了する、完成させる",
        exampleSentence: "Please complete the form before submitting it.",
      },
      {
        word: "report",
        meaning: "報告書、レポート",
        exampleSentence: "The manager reviewed the monthly sales report.",
      },
    ],
    options: [
      ["A", "complete", true],
      ["B", "invite", false],
      ["C", "attend", false],
      ["D", "replace", false],
    ],
  },

  {
    questionText: "The hotel offers free breakfast to all ______.",
    explanation:
      "正解は「A. guests」です。「guest」はホテルなどに滞在している『宿泊客、客』を意味します。この文ではホテルが無料の朝食を提供する相手について述べているため、「guests」が最も適切です。\n\n「The hotel offers free breakfast to all guests.」は「そのホテルはすべての宿泊客に無料の朝食を提供しています」という意味です。\n\n「all」の後なので複数形の「guests」が自然です。Bの「customers」は一般的な顧客、Cの「employees」は従業員、Dの「drivers」は運転手という意味で、ホテルに宿泊している人を直接表す語ではありません。\n\n「guest」はホテルだけでなく、イベントや番組などに招かれた人にも使えます。「hotel guest」は『ホテルの宿泊客』という頻出表現です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "guest",
        meaning: "宿泊客、客",
        exampleSentence: "All hotel guests can use the swimming pool.",
      },
      {
        word: "offer",
        meaning: "提供する、申し出る",
        exampleSentence: "The hotel offers free Wi-Fi to all guests.",
      },
    ],
    options: [
      ["A", "guests", true],
      ["B", "customers", false],
      ["C", "employees", false],
      ["D", "drivers", false],
    ],
  },

  {
    questionText:
      "Please keep your receipt in case you need to ______ the item.",
    explanation:
      "正解は「A. return」です。「return」は、この文脈では購入した商品を店に『返品する、返す』という意味です。\n\n「Please keep your receipt in case you need to return the item.」は「商品を返品する必要がある場合に備えて、レシートを保管しておいてください」という意味です。\n\n「in case」は「～の場合に備えて」という意味なので、返品する可能性に備えてレシートを取っておく、という自然な状況になっています。\n\nBの「reserve」は「予約する」、Cの「borrow」は「借りる」、Dの「deliver」は「配達する」という意味で、この文脈には合いません。\n\n「return an item」は買い物・カスタマーサービスで非常によく使われる表現です。また、「return」には『戻る』『返す』など複数の意味があるため、文脈によって意味を判断することが重要です。",
    difficulty: "beginner",
    vocabulary: [
      {
        word: "receipt",
        meaning: "レシート、領収書",
        exampleSentence: "Please keep your receipt until the warranty expires.",
      },
      {
        word: "return",
        meaning: "返品する、返す",
        exampleSentence: "You can return the item within thirty days.",
      },
      {
        word: "item",
        meaning: "商品、品物",
        exampleSentence: "This item is currently out of stock.",
      },
    ],
    options: [
      ["A", "return", true],
      ["B", "reserve", false],
      ["C", "borrow", false],
      ["D", "deliver", false],
    ],
  },
]

/*
 * ============================================================================
 * REPLACE EXISTING BEGINNER TOEIC PART 5 QUESTIONS
 * ============================================================================
 *
 * Everything happens inside one transaction.
 *
 * 1. Find all existing beginner Part 5 questions.
 * 2. Delete their options first.
 * 3. Delete the questions.
 * 4. Insert the new question set.
 *
 * If anything fails, the transaction is rolled back.
 */

await db.transaction(async (tx) => {
  console.log("🗑️ Removing existing TOEIC Part 5 beginner questions...")

  const existingQuestions = await tx
    .select({
      id: practiceQuestions.id,
    })
    .from(practiceQuestions)
    .where(
      and(
        eq(practiceQuestions.exam, "toeic"),
        eq(practiceQuestions.part, "5"),
        eq(practiceQuestions.difficulty, "beginner"),
      ),
    )

  console.log(`Found ${existingQuestions.length} existing questions to remove.`)

  /*
   * Delete options first because they reference practiceQuestions.
   */

  for (const question of existingQuestions) {
    await tx
      .delete(practiceQuestionOptions)
      .where(eq(practiceQuestionOptions.questionId, question.id))
  }

  /*
   * Then delete the questions themselves.
   */

  for (const question of existingQuestions) {
    await tx
      .delete(practiceQuestions)
      .where(eq(practiceQuestions.id, question.id))
  }

  console.log("✅ Existing questions removed.")

  /*
   * ==========================================================================
   * INSERT NEW QUESTIONS
   * ==========================================================================
   */

  for (const item of questions) {
    const [question] = await tx
      .insert(practiceQuestions)
      .values({
        exam: "toeic",
        part: "5",
        questionType: "multiple_choice",
        questionText: item.questionText,
        explanation: item.explanation,
        difficulty: item.difficulty,
        vocabulary: item.vocabulary,
      })
      .returning({
        id: practiceQuestions.id,
      })

    if (!question) {
      throw new Error(`Failed to create question: ${item.questionText}`)
    }

    await tx.insert(practiceQuestionOptions).values(
      item.options.map(([label, text, isCorrect]) => ({
        questionId: question.id,
        optionLabel: label,
        optionText: text,
        isCorrect,
      })),
    )
  }

  console.log(
    `🌱 Inserted ${questions.length} new TOEIC Part 5 beginner questions.`,
  )
})

console.log(
  `🎉 Successfully replaced TOEIC Part 5 beginner question bank with ${questions.length} questions.`,
)
