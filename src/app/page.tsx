import Link from "next/link";

const CRITERIA = [
  {
    title: "実績×評価の信頼度",
    body: "実績数と「残念」評価の件数から、母数の少なさによる偶然のブレを補正したスコアを算出します。",
  },
  {
    title: "完了率",
    body: "受注したプロジェクトを最後までやり遂げているかを数値化して反映します。",
  },
  {
    title: "バッジ",
    body: "認定ランサー・シルバー・ブロンズ・レギュラー・初心者に優しいの各バッジを加点要素として考慮します。",
  },
  {
    title: "本人確認等のステータス",
    body: "本人確認・秘密保持確認・電話確認・ランサーズチェックの完了状況を確認し、本人確認未完了の応募者は候補から自動的に除外します。",
  },
];

export default function Home() {
  return (
    <div className="flex-1">
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-sm font-medium tracking-wide text-sky-400">
            for Lancers クライアント
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            100人を超える応募者の中から、
            <br />
            迷わず最適な1人を選べるように。
          </h1>
          <p className="mt-6 max-w-2xl text-slate-300">
            Lancersでプロジェクトを公開すると、多くの応募が集まるのは嬉しい反面、
            「応募が多すぎて誰を選べばよいか分からない」という悩みが生まれます。
            このツールは、募集要項と提案一覧をCSVでインポートするだけで、
            実績・評価・完了率・バッジ・本人確認状況などをもとに候補者を自動でランキングし、
            クライアントの選定にかかる負担を軽減します。
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/register"
              className="rounded-md bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-400"
            >
              新規登録
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-xl font-bold text-slate-900">背景</h2>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Lancersでは1件のプロジェクトに100人以上が入札することも珍しくありません。
          応募者が多いこと自体は良いことですが、クライアントは一人ひとりのプロフィールを見比べる時間的余裕がなく、
          結果として「誰が一番信頼できるのか」を判断しづらいという課題があります。
          本ツールは、Lancers上で公開されている実績・評価・バッジ・各種確認ステータスといった情報を
          定量的なスコアに変換し、根拠のある形で候補者を絞り込めるようにすることを目的としています。
        </p>

        <h2 className="mt-12 text-xl font-bold text-slate-900">
          何をもとにランキングするか
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {CRITERIA.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-slate-900">利用の流れ</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-600">
          <li>登録・ログインする</li>
          <li>プロジェクトの募集要項CSVと、応募者の提案一覧CSVをインポートする</li>
          <li>自動生成されたランキングを確認する</li>
          <li>
            「最終選択」ボタンで候補者を確定 → 決済（日本円 or 暗号資産）を完了すると選定内容が確定する
          </li>
        </ol>
      </section>
    </div>
  );
}
