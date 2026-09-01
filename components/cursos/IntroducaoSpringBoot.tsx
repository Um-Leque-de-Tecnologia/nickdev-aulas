import BadgesDeTecnologia from "@/components/BadgesDeTecnologia";
import { materialDaAula } from "@/lib/cdn";

/**
 * O conteudo da landing do curso, sem moldura nenhuma.
 *
 * Nem cabecalho, nem rodape, nem "voltar": quem monta a moldura e a rota. A
 * publica (`app/cursos/introducao-spring-boot/page.tsx`) poe o SiteHeader e o Footer; a
 * logada (`app/(private)/painel/cursos/[slug]`) deixa a sidebar da area
 * logada fazer esse papel, que e o motivo de a moldura ter saido daqui.
 *
 * Duas molduras, um conteudo so. Enquanto o texto morava dentro da pagina
 * publica, mostrar o mesmo curso na area logada exigia manter duas copias
 * em dia na mao -- e a segunda ia ficar para tras no primeiro dia corrido.
 */

const AULA_01 = materialDaAula("introducao-spring-boot", "aula-01-primeira-api");
const AULA_02 = materialDaAula("introducao-spring-boot", "aula-02-beans-e-injecao");
const AULA_03 = materialDaAula("introducao-spring-boot", "aula-03-api-rest");
const PROJETO = materialDaAula("introducao-spring-boot", "projeto");

export default function IntroducaoSpringBoot() {
  return (
    <>
      <div className="eyebrow">Curso · 18 aulas · 2026.2</div>
      <h1>
        Introdução ao <span className="grad-text">Spring Boot</span>
      </h1>
      <p className="lead">
        Do Java puro a uma API REST pronta pra produção: inversão de controle e
        injeção de dependência, Spring MVC, persistência com JPA, validação,
        tratamento de erros, segurança com JWT, testes automatizados,
        observabilidade e deploy em contêiner. Pré-requisito: orientação a
        objetos com Java. A avaliação é um <span className="mono">projeto em
        duas etapas</span> — não há prova.
      </p>
      <BadgesDeTecnologia tecnologias={["java", "spring-boot"]} />
      <div className="brand-rule" />

      <div className="acoes">
        <a
          className="glow-btn"
          href="https://www.youtube.com/playlist?list=PLcHfvbd8oBOI"
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ Aulas gravadas
        </a>
      </div>

      <div className="section-label">Projeto do curso</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">💼</div>
          <div className="body">
            <h3>Leque de Vagas — a API</h3>
            <p>
              Vagas de tecnologia para quem está migrando de carreira. A turma
              não constrói a tela — constrói <strong>o outro lado</strong>: o
              programa que guarda as vagas, as empresas e as candidaturas.{" "}
              <strong>Quatro frentes, uma por integrante da equipe</strong>, e a
              cada aula o desafio tem uma parte para cada frente. Nasce na aula
              02 como três classes e termina como uma API autenticada,
              documentada e rodando em contêiner.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${PROJETO}/brief.html`}>
                💼 Briefing e rubrica
              </a>
              <a
                className="mat"
                href="https://github.com/Um-Leque-de-Tecnologia/leque-de-vagas"
                target="_blank"
                rel="noopener noreferrer"
              >
                💻 O front que consome esta API
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="section-label">Unidade I · Fundamentos do Spring e API REST</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">01</div>
          <div className="body">
            <h3>Do Java ao Spring: IoC, DI e a primeira API</h3>
            <p>
              11/08 · Plano de ensino e critérios de avaliação. Por que existe um
              framework: acoplamento e código repetido. Inversão de controle e
              injeção de dependência — o conceito antes do código. Spring Boot ×
              Spring tradicional: autoconfiguração e starters. Setup do JDK 21,
              Maven e Spring Initializr. Anatomia do projeto,{" "}
              <span className="mono">application.properties</span> e o primeiro
              endpoint.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_01}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_01}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_01}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_01}/modelo-resposta.html`}>
                🧑‍💻 Modelo de resposta
              </a>
            </div>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">02</div>
          <div className="body">
            <h3>Controller, service e repository</h3>
            <p>
              18/08 · As três camadas de uma API e o que fica em cada uma. Como
              se escreve um <span className="mono">@Repository</span>, um{" "}
              <span className="mono">@Service</span> e um{" "}
              <span className="mono">@RestController</span> — uma de cada vez,
              separando o controller da aula 01 que fazia tudo sozinho. A
              ligação entre elas: a classe recebe pronto pelo construtor o que
              precisa, em campo <span className="mono">final</span>, sem{" "}
              <span className="mono">new</span>. Como ler o erro de dependência
              não encontrada e as suas duas causas. Entrega da atividade 1 e
              formação das equipes.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_02}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_02}/exercicios.html`}>
                🧪 Exercícios em aula
              </a>
              <a className="mat" href={`${AULA_02}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_02}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              <a className="mat" href={`${AULA_02}/modelo-resposta.html`}>
                👁️ Prévia da resposta
              </a>
              <a className="mat" href={`${PROJETO}/brief.html`}>
                💼 Briefing do projeto
              </a>
            </div>
          </div>
        </div>

        <div className="lesson">
          <div className="idx">03</div>
          <div className="body">
            <h3>API REST: recursos, verbos e status</h3>
            <p>
              25/08 · A API da aula 02 responde{" "}
              <span className="mono">200</span> para uma vaga que não existe — e
              é isso que a aula conserta. Recursos, verbos HTTP, códigos de
              status e idempotência.{" "}
              <span className="mono">ResponseEntity</span> escolhendo entre 200 e
              404, <span className="mono">@RequestBody</span> e o{" "}
              <span className="mono">201</span> com cabeçalho{" "}
              <span className="mono">Location</span>,{" "}
              <span className="mono">@RequestParam</span> para busca. Testes
              manuais com arquivo <span className="mono">.http</span> versionado.
              Entrega do esqueleto do projeto e início da segunda parte.
            </p>
            <div className="mats">
              <a className="mat primary" href={`${AULA_03}/slides.html`}>
                ▶ Slides da aula
              </a>
              <a className="mat" href={`${AULA_03}/exercicios.html`}>
                🧪 Exercícios em aula
              </a>
              <a className="mat" href={`${AULA_03}/desafio.html`}>
                🎯 Desafio
              </a>
              <a className="mat" href={`${AULA_03}/codigos-desafio.html`}>
                🧩 Código do desafio
              </a>
              {/*
                A aula 03 não lista "Prévia da resposta" nem "Briefing do
                projeto", e a ausência é decisão — não link que faltou.

                Os dois arquivos continuam publicados: `modelo-resposta.html`
                está entre os cinco assets desta aula na API, e o `brief.html`
                está na aula `projeto`. Tirar o botão esconde a porta, não fecha
                — quem tiver o endereço continua abrindo. Se um dia a intenção
                for impedir o acesso, e não só deixar de oferecer, isso se
                resolve na API, despublicando o arquivo.
              */}
            </div>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">04</div>
          <div className="body">
            <h3>DTOs, validação e tratamento de erros</h3>
            <p>
              01/09 · DTOs com <span className="mono">record</span> e a separação
              entre modelo de domínio e contrato da API. Bean Validation:{" "}
              <span className="mono">@Valid</span>,{" "}
              <span className="mono">@NotBlank</span>,{" "}
              <span className="mono">@Email</span> e validadores customizados.
              Tratamento global com{" "}
              <span className="mono">@RestControllerAdvice</span> e respostas de
              erro padronizadas (Problem Details).
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">05</div>
          <div className="body">
            <h3>Spring Data JPA: entidades e repositórios</h3>
            <p>
              08/09 · <span className="mono">@Entity</span>,{" "}
              <span className="mono">@Id</span>,{" "}
              <span className="mono">@GeneratedValue</span> e{" "}
              <span className="mono">@Column</span>.{" "}
              <span className="mono">JpaRepository</span> e o CRUD que você não
              escreve. Banco H2 em memória e console web.{" "}
              <span className="mono">ddl-auto</span> e o que usar em cada
              ambiente.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">06</div>
          <div className="body">
            <h3>Relacionamentos JPA e suas armadilhas</h3>
            <p>
              15/09 · <span className="mono">@OneToMany</span>,{" "}
              <span className="mono">@ManyToOne</span>,{" "}
              <span className="mono">@ManyToMany</span> e{" "}
              <span className="mono">@OneToOne</span>. Fetch LAZY × EAGER,
              cascade e orphanRemoval. As três clássicas:{" "}
              <span className="mono">LazyInitializationException</span>,
              serialização circular e o problema N+1.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">07</div>
          <div className="body">
            <h3>Consultas, projeções e paginação</h3>
            <p>
              22/09 · Query methods derivados do nome,{" "}
              <span className="mono">@Query</span> com JPQL e consultas nativas.
              Projeções para não trazer o que não se usa. Paginação e ordenação
              com <span className="mono">Pageable</span> e{" "}
              <span className="mono">Page</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">08</div>
          <div className="body">
            <h3>Camada de serviço, transações e laboratório</h3>
            <p>
              29/09 · Regra de negócio fora do controller. Transações com{" "}
              <span className="mono">@Transactional</span>: propagação, rollback
              e leitura. Segunda metade da aula: laboratório e mentoria por
              equipe para fechar a 1ª etapa do projeto.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx" style={{ fontSize: "13px" }}>
            AV1
          </div>
          <div className="body">
            <h3>Entrega e apresentação da 1ª etapa do projeto</h3>
            <p>
              06/10 · Semana oficial de 05 a 09/10. A API funcionando por dentro:
              modelo de dados com relacionamentos, CRUD completo, DTOs,
              validação, tratamento de erros, camadas separadas, banco H2,
              repositório Git com histórico e README com a coleção de
              requisições.
            </p>
            <span className="soon-tag">avaliação</span>
          </div>
        </div>
      </div>

      <div className="section-label">Unidade II · Segurança, integração e entrega</div>

      <div className="lessons">
        <div className="lesson soon">
          <div className="idx">09</div>
          <div className="body">
            <h3>Devolutiva da AV1 e testes automatizados</h3>
            <p>
              13/10 · Correção comentada da 1ª etapa, equipe por equipe. JUnit 5
              e Mockito na camada de serviço.{" "}
              <span className="mono">@WebMvcTest</span> com{" "}
              <span className="mono">MockMvc</span> para controllers e{" "}
              <span className="mono">@DataJpaTest</span> para repositórios.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">10</div>
          <div className="body">
            <h3>Spring Security: autenticação</h3>
            <p>
              20/10 · A cadeia de filtros e o{" "}
              <span className="mono">SecurityFilterChain</span>. Usuários em
              banco com <span className="mono">UserDetailsService</span>, hash de
              senha com BCrypt. Autorização por rota e configuração de CORS.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">11</div>
          <div className="body">
            <h3>JWT e autorização por perfil</h3>
            <p>
              27/10 · Autenticação stateless: endpoint de login, geração e
              validação do token, filtro customizado. Perfis de acesso (roles) e
              autorização em método com{" "}
              <span className="mono">@PreAuthorize</span>. Refresh token em visão
              geral.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">12</div>
          <div className="body">
            <h3>Documentação da API com OpenAPI</h3>
            <p>
              03/11 · Swagger UI gerado do código com springdoc. Boas práticas de
              design REST, versionamento de API e evolução de contrato.
              Checkpoint 1: segurança e documentação funcionando no projeto.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">13</div>
          <div className="body">
            <h3>Consumindo outras APIs e arquivos</h3>
            <p>
              10/11 · <span className="mono">RestClient</span> e{" "}
              <span className="mono">WebClient</span>, cliente declarativo com
              OpenFeign. Timeouts, retentativas e o que fazer quando o serviço do
              outro lado cai. Upload e download de arquivos.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">14</div>
          <div className="body">
            <h3>Configuração por ambiente e observabilidade</h3>
            <p>
              17/11 · Profiles, variáveis de ambiente e segredos fora do código.
              Migração de H2 para PostgreSQL e versionamento de schema com
              Flyway. Spring Boot Actuator: health, metrics e info. Logging
              estruturado.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">15</div>
          <div className="body">
            <h3>Docker e deploy</h3>
            <p>
              24/11 · Dockerfile da aplicação e{" "}
              <span className="mono">docker compose</span> com banco. Deploy em
              nuvem gratuita. Checklist de entrega: README, variáveis e coleção
              de requisições. Checkpoint 2: mentoria por equipe e definição da
              ordem de apresentação.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">16</div>
          <div className="body">
            <h3>Apresentações — 1ª rodada</h3>
            <p>
              01/12 · Metade das equipes. Demonstração da API em execução, com
              endpoints protegidos e documentação publicada.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx" style={{ fontSize: "13px" }}>
            AV2
          </div>
          <div className="body">
            <h3>Apresentações — 2ª rodada e entrega final</h3>
            <p>
              15/12 · Aula 17. Restante das equipes. Entrega final do código, da
              documentação e do link do deploy. Reposição para casos
              justificados na semana de 14 a 16/12.
            </p>
            <span className="soon-tag">avaliação</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">18</div>
          <div className="body">
            <h3>Encerramento do semestre</h3>
            <p>
              22/12 · Divulgação das notas, feedback individual dos projetos e
              retrospectiva da disciplina. Por onde seguir depois daqui.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>
      </div>
    </>
  );
}
