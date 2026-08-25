import { guiasDe, hrefDoGuia } from "@/lib/guias";

type Props = {
  /** Slugs das tecnologias do curso, na ordem em que aparecem nele. */
  tecnologias: string[];
};

/**
 * A fileira de guias que um curso usa, logo abaixo do subtítulo.
 *
 * Fica mais discreta que os `.mat` das aulas de propósito: é navegação
 * secundária e não pode competir com os botões de material.
 */
export default function BadgesDeTecnologia({ tecnologias }: Props) {
  return (
    <div className="tecs">
      <span className="tecs-rotulo">guias</span>
      {guiasDe(...tecnologias).map((g) => (
        <a className="tec" href={hrefDoGuia(g.slug)} key={g.slug}>
          <span aria-hidden="true">{g.emoji}</span>
          {g.nome}
        </a>
      ))}
    </div>
  );
}
