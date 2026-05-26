import { useEffect, useMemo, useState } from "react";

const API_KEY = import.meta.env.VITE_API_KEY;

const ESTADIOS_2026 = [
  "MetLife Stadium — Nova Iorque/Nova Jersey",
  "AT&T Stadium — Dallas",
  "SoFi Stadium — Los Angeles",
  "Hard Rock Stadium — Miami",
  "Mercedes-Benz Stadium — Atlanta",
  "NRG Stadium — Houston",
  "Lincoln Financial Field — Filadélfia",
  "Lumen Field — Seattle",
  "Levi's Stadium — San Francisco Bay Area",
  "Gillette Stadium — Boston",
  "Arrowhead Stadium — Kansas City",
  "BC Place — Vancouver",
  "BMO Field — Toronto",
  "Estadio Azteca — Cidade do México",
  "Estadio Akron — Guadalajara",
  "Estadio BBVA — Monterrey",
];

const grupos2026 = [
  { grupo: "A", times: [["México", "mx"], ["África do Sul", "za"], ["Coreia do Sul", "kr"], ["Playoff UEFA", ""]] },
  { grupo: "B", times: [["Canadá", "ca"], ["Suíça", "ch"], ["Qatar", "qa"], ["Playoff", ""]] },
  { grupo: "C", times: [["Brasil", "br"], ["Marrocos", "ma"], ["Haiti", "ht"], ["Escócia", "gb-sct"]] },
  { grupo: "D", times: [["Estados Unidos", "us"], ["Paraguai", "py"], ["Austrália", "au"], ["Turquia", "tr"]] },
  { grupo: "E", times: [["Alemanha", "de"], ["Curaçao", "cw"], ["Costa do Marfim", "ci"], ["Equador", "ec"]] },
  { grupo: "F", times: [["Países Baixos", "nl"], ["Japão", "jp"], ["Suécia", "se"], ["Tunísia", "tn"]] },
  { grupo: "G", times: [["Bélgica", "be"], ["Egito", "eg"], ["Irã", "ir"], ["Nova Zelândia", "nz"]] },
  { grupo: "H", times: [["Espanha", "es"], ["Cabo Verde", "cv"], ["Arábia Saudita", "sa"], ["Uruguai", "uy"]] },
  { grupo: "I", times: [["França", "fr"], ["Senegal", "sn"], ["Iraque", "iq"], ["Noruega", "no"]] },
  { grupo: "J", times: [["Argentina", "ar"], ["Argélia", "dz"], ["Áustria", "at"], ["Jordânia", "jo"]] },
  { grupo: "K", times: [["Portugal", "pt"], ["RD Congo", "cd"], ["Uzbequistão", "uz"], ["Colômbia", "co"]] },
  { grupo: "L", times: [["Inglaterra", "gb-eng"], ["Croácia", "hr"], ["Gana", "gh"], ["Panamá", "pa"]] },
];

function Bandeira({ codigo, nome }) {
  if (!codigo) {
    return (
      <div className="w-12 h-8 bg-slate-700 rounded-md flex items-center justify-center text-xs font-black">
        PO
      </div>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${codigo}.png`}
      alt={nome}
      className="w-12 h-8 rounded-md object-cover bg-slate-700"
    />
  );
}

export default function Copa2026Pro() {
  const [jogos, setJogos] = useState([]);
  const [modo, setModo] = useState("2022");
  const [favoritos, setFavoritos] = useState(() => {
    return JSON.parse(localStorage.getItem("favoritos-copa") || "[]");
  });
  const [contador, setContador] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [jogoSelecionado, setJogoSelecionado] = useState(null);
  const [escalacoes, setEscalacoes] = useState([]);
  const [carregandoEscalacao, setCarregandoEscalacao] = useState(false);

  const classificacaoInicial = useMemo(() => {
    return grupos2026.map((grupo) => ({
      grupo: grupo.grupo,
      times: grupo.times.map(([nome, codigo]) => ({
        nome,
        codigo,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        saldo: 0,
      })),
    }));
  }, []);

  const confrontosGrupos = useMemo(() => {
    return grupos2026.map((grupo) => {
      const t = grupo.times;
      return {
        grupo: grupo.grupo,
        jogos: [
          [t[0], t[1]],
          [t[2], t[3]],
          [t[0], t[2]],
          [t[3], t[1]],
          [t[3], t[0]],
          [t[1], t[2]],
        ],
      };
    });
  }, []);

  function atualizarContador() {
    const alvo = new Date("2026-06-11T00:00:00");
    const agora = new Date();
    const dif = alvo - agora;

    setContador({
      dias: Math.max(0, Math.floor(dif / (1000 * 60 * 60 * 24))),
      horas: Math.max(0, Math.floor((dif / (1000 * 60 * 60)) % 24)),
      minutos: Math.max(0, Math.floor((dif / (1000 * 60)) % 60)),
      segundos: Math.max(0, Math.floor((dif / 1000) % 60)),
    });
  }

  async function carregarJogos(tipo = modo) {
    let url = "https://v3.football.api-sports.io/fixtures?league=1&season=2022";

    if (tipo === "ao-vivo") {
      url = "https://v3.football.api-sports.io/fixtures?live=all";
    }

    if (tipo === "2026") {
      url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";
    }

    try {
      const response = await fetch(url, {
        headers: { "x-apisports-key": API_KEY },
      });

      const data = await response.json();

      const formatados = (data.response || []).slice(0, 24).map((jogo) => ({
        id: jogo.fixture.id,
        casa: jogo.teams.home.name,
        fora: jogo.teams.away.name,
        logoCasa: jogo.teams.home.logo,
        logoFora: jogo.teams.away.logo,
        placar: `${jogo.goals.home ?? "-"} x ${jogo.goals.away ?? "-"}`,
        data: new Date(jogo.fixture.date).toLocaleDateString("pt-PT"),
        hora: new Date(jogo.fixture.date).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        estadio: jogo.fixture.venue.name || "Estádio a confirmar",
        cidade: jogo.fixture.venue.city || "",
        status: jogo.fixture.status.long,
      }));

      setJogos(formatados);
      setModo(tipo);
    } catch (error) {
      console.log(error);
    }
  }

  async function abrirDetalhes(jogo) {
    setJogoSelecionado(jogo);
    setEscalacoes([]);
    setCarregandoEscalacao(true);

    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures/lineups?fixture=${jogo.id}`,
        {
          headers: { "x-apisports-key": API_KEY },
        }
      );

      const data = await response.json();
      setEscalacoes(data.response || []);
    } catch (error) {
      console.log(error);
    } finally {
      setCarregandoEscalacao(false);
    }
  }

  function alternarFavorito(id) {
    setFavoritos((atual) => {
      const novo = atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id];

      localStorage.setItem("favoritos-copa", JSON.stringify(novo));
      return novo;
    });
  }

  useEffect(() => {
    carregarJogos("2022");
    atualizarContador();

    const tempo = setInterval(atualizarContador, 1000);
    return () => clearInterval(tempo);
  }, []);

  useEffect(() => {
    if (modo !== "ao-vivo") return;

    const live = setInterval(() => carregarJogos("ao-vivo"), 30000);
    return () => clearInterval(live);
  }, [modo]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-gradient-to-r from-green-600 to-emerald-500 p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black">
            ⚽ Copa do Mundo 2026 PRO
          </h1>
          <p className="text-lg mt-3 text-white/90">
            Ao vivo • Grupos • Confrontos • Classificação • Escalações • Favoritos
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {[
            ["Dias", contador.dias],
            ["Horas", contador.horas],
            ["Minutos", contador.minutos],
            ["Segundos", contador.segundos],
          ].map(([label, valor]) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
              <div className="text-5xl font-black text-green-400">{valor}</div>
              <div className="text-slate-400 mt-2 uppercase text-sm tracking-widest">{label}</div>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap gap-4 mb-10">
          <button onClick={() => carregarJogos("ao-vivo")} className={`px-6 py-3 rounded-2xl font-bold ${modo === "ao-vivo" ? "bg-red-500" : "bg-slate-800"}`}>
            🔴 Ao Vivo
          </button>
          <button onClick={() => carregarJogos("2022")} className={`px-6 py-3 rounded-2xl font-bold ${modo === "2022" ? "bg-green-500 text-black" : "bg-slate-800"}`}>
            Copa 2022
          </button>
          <button onClick={() => carregarJogos("2026")} className={`px-6 py-3 rounded-2xl font-bold ${modo === "2026" ? "bg-green-500 text-black" : "bg-slate-800"}`}>
            Copa 2026
          </button>
        </section>

        <section className="mb-20">
          <h2 className="text-4xl font-black mb-8">🔥 Jogos</h2>

          {jogos.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
              <h3 className="text-2xl font-black mb-3">Nenhum jogo encontrado</h3>
              <p className="text-slate-400">A API pode ainda não ter jogos para esta opção.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jogos.map((jogo) => (
                <div key={jogo.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition">
                  <div className="flex justify-between mb-5">
                    <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      {jogo.status}
                    </span>
                    <button onClick={() => alternarFavorito(jogo.id)} className="text-2xl">
                      {favoritos.includes(jogo.id) ? "⭐" : "☆"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <div className="text-center w-24">
                      <img src={jogo.logoCasa} alt={jogo.casa} className="w-14 h-14 mx-auto mb-2" />
                      <p className="font-bold text-sm">{jogo.casa}</p>
                    </div>

                    <div className="text-3xl font-black">{jogo.placar}</div>

                    <div className="text-center w-24">
                      <img src={jogo.logoFora} alt={jogo.fora} className="w-14 h-14 mx-auto mb-2" />
                      <p className="font-bold text-sm">{jogo.fora}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4 text-sm text-slate-400 space-y-2">
                    <p>📅 {jogo.data}</p>
                    <p>🕒 {jogo.hora}</p>
                    <p>📍 {jogo.estadio}</p>
                    <p>🌍 {jogo.cidade}</p>
                  </div>

                  <button
                    onClick={() => abrirDetalhes(jogo)}
                    className="mt-5 w-full bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-2xl"
                  >
                    Ver escalações
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {jogoSelecionado && (
          <section className="mb-20 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black">
                📋 Escalações — {jogoSelecionado.casa} x {jogoSelecionado.fora}
              </h2>
              <button onClick={() => setJogoSelecionado(null)} className="bg-slate-800 px-4 py-2 rounded-xl">
                Fechar
              </button>
            </div>

            {carregandoEscalacao ? (
              <p className="text-slate-400">Carregando escalações...</p>
            ) : escalacoes.length === 0 ? (
              <p className="text-slate-400">
                Escalações ainda não disponíveis. Normalmente aparecem perto do início do jogo.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {escalacoes.map((time) => (
                  <div key={time.team.id} className="bg-slate-800 rounded-3xl p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <img src={time.team.logo} alt={time.team.name} className="w-10 h-10" />
                      <h3 className="text-2xl font-black">{time.team.name}</h3>
                    </div>

                    <p className="text-green-400 font-bold mb-3">Formação: {time.formation || "A confirmar"}</p>

                    <div className="space-y-2">
                      {(time.startXI || []).map((item) => (
                        <div key={item.player.id} className="bg-slate-900 rounded-xl p-3 text-sm">
                          {item.player.number} — {item.player.name} ({item.player.pos})
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mb-20">
          <h2 className="text-4xl font-black mb-10">🌎 Grupos Oficiais Copa 2026</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grupos2026.map((grupo) => (
              <div key={grupo.grupo} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-3xl font-black mb-6 text-green-400">
                  Grupo {grupo.grupo}
                </h3>

                <div className="space-y-4">
                  {grupo.times.map(([nome, codigo]) => (
                    <div key={nome} className="bg-slate-800 rounded-2xl p-4 flex items-center gap-4">
                      <Bandeira codigo={codigo} nome={nome} />
                      <span className="font-black text-lg tracking-wide">{nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-4xl font-black mb-10">📊 Classificação dos Grupos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classificacaoInicial.map((grupo) => (
              <div key={grupo.grupo} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-2xl font-black text-green-400 mb-5">
                  Grupo {grupo.grupo}
                </h3>

                <div className="space-y-3">
                  {grupo.times.map((time, index) => (
                    <div key={time.nome} className="bg-slate-800 rounded-2xl p-4 grid grid-cols-6 gap-2 items-center text-sm">
                      <div className="col-span-3 flex items-center gap-3">
                        <span className="font-black">{index + 1}</span>
                        <Bandeira codigo={time.codigo} nome={time.nome} />
                        <span className="font-bold">{time.nome}</span>
                      </div>
                      <span>J {time.jogos}</span>
                      <span>SG {time.saldo}</span>
                      <span className="font-black text-green-400">Pts {time.pontos}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-4xl font-black mb-10">📅 Confrontos da Fase de Grupos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {confrontosGrupos.map((grupo) => (
              <div key={grupo.grupo} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-2xl font-black text-green-400 mb-5">
                  Grupo {grupo.grupo}
                </h3>

                <div className="space-y-3">
                  {grupo.jogos.map(([a, b], index) => (
                    <div key={index} className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Bandeira codigo={a[1]} nome={a[0]} />
                        <span className="font-bold">{a[0]}</span>
                      </div>

                      <span className="text-green-400 font-black">x</span>

                      <div className="flex items-center gap-2 text-right">
                        <span className="font-bold">{b[0]}</span>
                        <Bandeira codigo={b[1]} nome={b[0]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-4xl font-black mb-10">🏆 Fase Final Copa 2026</h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[
              ["16 avos", "32 equipas", "2 primeiros de cada grupo + 8 melhores terceiros"],
              ["Oitavas", "16 equipas", "Confrontos definidos após os 16 avos"],
              ["Quartos", "8 equipas", "Confrontos definidos após as oitavas"],
              ["Semifinais / Final", "4 equipas", "Final no MetLife Stadium"],
            ].map(([fase, equipas, texto]) => (
              <div key={fase} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-2xl font-black text-green-400 mb-4">{fase}</h3>
                <p className="text-xl font-black mb-3">{equipas}</p>
                <p className="text-slate-400">{texto}</p>
                <div className="mt-6 bg-slate-800 rounded-2xl p-4 text-center font-bold">
                  A definir
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-4xl font-black mb-10">🏟️ Estádios Oficiais 2026</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ESTADIOS_2026.map((estadio) => (
              <div key={estadio} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 font-bold shadow-xl">
                {estadio}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}