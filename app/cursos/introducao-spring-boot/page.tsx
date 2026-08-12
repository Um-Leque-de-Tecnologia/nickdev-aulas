import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Introdução ao Spring Boot · NickDev",
  description:
    "Curso de Java avançado com Spring Boot: injeção de dependência, API REST, Spring Data JPA, validação, segurança com JWT, testes, observabilidade, Docker e deploy.",
};

const AULA_01 = "/cursos/introducao-spring-boot/aula-01-primeira-api";

export default function JavaSpringBoot() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

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
      <div className="brand-rule" />

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
              <a className="mat" href={`${AULA_01}/guia-spring-boot.html`}>
                📘 Guia do Spring Boot
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

        <div className="lesson soon">
          <div className="idx">02</div>
          <div className="body">
            <h3>Spring Core: contêiner, beans e injeção</h3>
            <p>
              18/08 · O <span className="mono">ApplicationContext</span> por
              dentro. Estereótipos <span className="mono">@Component</span>,{" "}
              <span className="mono">@Service</span>,{" "}
              <span className="mono">@Repository</span> e{" "}
              <span className="mono">@Configuration</span>. Injeção por
              construtor e por que evitar <span className="mono">@Autowired</span>{" "}
              em campo. Escopos e ciclo de vida. Configuração externa com{" "}
              <span className="mono">@Value</span> e profiles. Entrega da
              atividade 1 e formação das equipes.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">03</div>
          <div className="body">
            <h3>API REST: recursos, verbos e status</h3>
            <p>
              25/08 · Fundamentos de REST: recursos, verbos HTTP, códigos de
              status e idempotência. <span className="mono">@RestController</span>{" "}
              e os mapeamentos. <span className="mono">@PathVariable</span>,{" "}
              <span className="mono">@RequestParam</span> e{" "}
              <span className="mono">@RequestBody</span>.{" "}
              <span className="mono">ResponseEntity</span> e cabeçalhos. Testes
              manuais com Insomnia e arquivos{" "}
              <span className="mono">.http</span>. Entrega da proposta do
              projeto.
            </p>
            <span className="soon-tag">em breve</span>
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

      <Footer withHome />
    </>
  );
}
