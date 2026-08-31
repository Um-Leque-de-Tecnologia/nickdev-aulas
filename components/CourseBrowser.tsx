"use client";

import { useId, useState } from "react";
import Link from "next/link";
import ExclusiveBadge from "@/components/ExclusiveBadge";
import { technologiesOf, type Course } from "@/lib/cursos";
import { guiasDe } from "@/lib/guias";

/**
 * A busca e os filtros do painel.
 *
 * É Client Component porque digitar e clicar são eventos, e evento só existe no
 * cliente. A prop é a lista de cursos e nada mais: tudo que atravessa esta
 * fronteira vai no HTML como payload serializado do React, legível por qualquer
 * pessoa que abra o código-fonte. Catálogo é dado público; sessão não é, e por
 * isso não entra aqui.
 *
 * O ponto de estudo deste arquivo: existem DOIS estados, o texto e a
 * tecnologia. A lista filtrada não é um terceiro — ela é calculada na
 * renderização, a partir dos dois. Guardar a lista num `useState` obrigaria a
 * lembrar de recalculá-la em cada `onChange`, e o dia em que alguém esquecesse
 * de um deles a tela mostraria o resultado da busca anterior. Estado derivado
 * não tem como ficar dessincronizado: ele não é guardado.
 */

type CourseBrowserProps = {
  /** Já vem na ordem certa de `coursesFor()` — exclusivos primeiro. */
  courses: Course[];
};

/** O chip "Todas" precisa de um valor; sentinela em vez de `null` para o
    estado ser sempre uma string e a comparação dos chips ser uma só. */
const ALL_TECHNOLOGIES = "all";

/**
 * Minúscula e sem acento, para "orientacao" achar "Orientação a Objetos".
 * `NFD` separa a letra do acento e a faixa `\u0300-\u036f` apaga só o acento —
 * a letra base fica. Sem isso, quem digita sem acento (a maioria, no celular)
 * não acha metade do catálogo.
 */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** A busca casa nome e resumo — o resumo é onde estão as palavras que a pessoa
    lembra do curso ("deploy", "JWT"), e ignorá-lo seria desperdiçar texto bom. */
function matches(course: Course, needle: string, technology: string): boolean {
  if (technology !== ALL_TECHNOLOGIES && !course.technologies.includes(technology)) {
    return false;
  }
  if (needle === "") return true;
  return fold(`${course.name} ${course.summary}`).includes(needle);
}

function CourseCard({ course }: { course: Course }) {
  const body = (
    <>
      {/*
        O selo sai do catálogo, não de uma lista à parte: quem entra em
        `lib/cursos.ts` como "restricted" já aparece marcado aqui. O pill fica
        dentro do <h3> para o nome e o selo quebrarem juntos numa linha só,
        e o leitor de tela anuncia "Exclusivo" como parte do título do card.
      */}
      <h3>
        {course.name}
        {course.access === "restricted" && <ExclusiveBadge />}
      </h3>
      <p>{course.summary}</p>
      <div className="meta">
        {course.access === "public" ? "aberto a todo mundo" : "liberado para você"}
      </div>
    </>
  );

  // Curso sem página pública não tem para onde levar ainda. Card sem link é
  // melhor do que link que cai em 404.
  if (!course.href) return <div className="card">{body}</div>;

  return (
    <Link className="card" href={course.href}>
      {body}
    </Link>
  );
}

export default function CourseBrowser({ courses }: CourseBrowserProps) {
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState(ALL_TECHNOLOGIES);
  // O <label> precisa de um `htmlFor` que não colida se um dia houver duas
  // buscas na mesma tela. `useId` resolve isso e é estável entre servidor e
  // cliente, então não quebra a hidratação.
  const searchId = useId();

  // Daqui para baixo é tudo derivado. São seis cursos: `useMemo` aqui custaria
  // mais leitura do que economiza processamento.
  const technologies = technologiesOf(courses);
  const needle = fold(query.trim());
  const visible = courses.filter((course) => matches(course, needle, technology));

  function clearFilters() {
    setQuery("");
    setTechnology(ALL_TECHNOLOGIES);
  }

  return (
    <div className="browser">
      <div className="browser__field">
        <label className="visually-hidden" htmlFor={searchId}>
          Buscar curso por nome ou assunto
        </label>
        <input
          className="search-input"
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou assunto…"
          autoComplete="off"
        />
      </div>

      {/*
        Escolha única, e não múltipla: são seis cursos. Marcar duas tecnologias
        levantaria a pergunta "e ou ou?", que precisa de explicação na tela —
        complexidade que este catálogo não paga.
      */}
      <div className="browser__filters" role="group" aria-label="Filtrar por tecnologia">
        <FilterChip
          label="Todas"
          selected={technology === ALL_TECHNOLOGIES}
          onSelect={() => setTechnology(ALL_TECHNOLOGIES)}
        />
        {guiasDe(...technologies).map((guia) => (
          <FilterChip
            key={guia.slug}
            emoji={guia.emoji}
            label={guia.nome}
            selected={technology === guia.slug}
            onSelect={() => setTechnology(guia.slug)}
          />
        ))}
      </div>

      {/*
        `aria-live` porque filtrar não move o foco: quem usa leitor de tela
        digita e, sem isto, não fica sabendo que a lista encolheu.
      */}
      <p className="browser__count" aria-live="polite">
        {visible.length} de {courses.length}{" "}
        {courses.length === 1 ? "curso" : "cursos"}
      </p>

      {visible.length > 0 ? (
        <div className="card-grid">
          {visible.map((course) => (
            <CourseCard course={course} key={course.slug} />
          ))}
        </div>
      ) : (
        <div className="browser__empty">
          <p>
            Procurei nos seus cursos e nenhum casa com esse recorte. Tenta tirar
            uma palavra da busca — ou limpa tudo e olha o leque inteiro.
          </p>
          <button className="mat" type="button" onClick={clearFilters}>
            Limpar busca e filtros
          </button>
        </div>
      )}
    </div>
  );
}

type FilterChipProps = {
  emoji?: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

function FilterChip({ emoji, label, selected, onSelect }: FilterChipProps) {
  return (
    <button
      className={selected ? "mat is-selected" : "mat"}
      type="button"
      onClick={onSelect}
      /*
        `aria-pressed` é o que diz, em voz alta, qual chip está ligado — a borda
        e a cor só servem para quem enxerga. E o "✓" existe pelo mesmo motivo do
        outro lado: quem não distingue as cores da marca precisa de uma segunda
        pista, visual, de que este é o chip escolhido.
      */
      aria-pressed={selected}
    >
      {selected && <span aria-hidden="true">✓</span>}
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label}
    </button>
  );
}
