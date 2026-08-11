import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Java Avançado com Spring Boot · NickDev",
  description:
    "Curso de Java avançado com Spring Boot: injeção de dependência, API REST, Spring Data JPA, validação, segurança com JWT, testes, observabilidade, Docker e deploy.",
};

const AULA_01 = "/cursos/java-spring-boot/aula-01-primeira-api";

export default function JavaSpringBoot() {
  return (
    <>
      <Link className="backlink" href="/">
        ← todos os cursos
      </Link>

      <SiteHeader />

      <div className="eyebrow">Curso · 18 aulas</div>
      <h1>
        Java Avançado <span className="grad-text">com Spring Boot</span>
      </h1>
      <p className="lead">
        Do Java puro a uma API REST pronta pra produção: inversão de controle e
        injeção de dependência, Spring MVC, persistência com JPA, validação,
        tratamento de erros, segurança com JWT, testes automatizados,
        observabilidade e deploy em contêiner. Pré-requisito: orientação a
        objetos com Java.
      </p>
      <div className="brand-rule" />

      <div className="section-label">Aulas</div>

      <div className="lessons">
        <div className="lesson">
          <div className="idx">01</div>
          <div className="body">
            <h3>Do Java puro ao Spring: IoC, DI e a primeira API</h3>
            <p>
              O problema que o Spring resolve: acoplamento e código repetido.
              Inversão de controle e injeção de dependência na prática. Criar o
              projeto no Spring Initializr, entender a estrutura, escrever o
              primeiro <span className="mono">@RestController</span> e ver a API
              respondendo no navegador.
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
            <h3>Spring MVC: rotas, verbos e status</h3>
            <p>
              <span className="mono">@GetMapping</span>,{" "}
              <span className="mono">@PostMapping</span> e companhia.{" "}
              <span className="mono">@PathVariable</span>,{" "}
              <span className="mono">@RequestParam</span> e{" "}
              <span className="mono">@RequestBody</span>. Status HTTP que fazem
              sentido e <span className="mono">ResponseEntity</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">03</div>
          <div className="body">
            <h3>DTOs, validação e erros</h3>
            <p>
              Por que não expor a entidade. Records como DTO. Bean Validation
              (<span className="mono">@NotBlank</span>,{" "}
              <span className="mono">@Email</span>) e tratamento global com{" "}
              <span className="mono">@RestControllerAdvice</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">04</div>
          <div className="body">
            <h3>Spring Data JPA: entidades e repositórios</h3>
            <p>
              <span className="mono">@Entity</span>, chaves,{" "}
              <span className="mono">JpaRepository</span> e o CRUD que você não
              precisa escrever. Banco H2 em memória pra começar rápido.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">05</div>
          <div className="body">
            <h3>Relacionamentos e consultas</h3>
            <p>
              <span className="mono">@OneToMany</span>,{" "}
              <span className="mono">@ManyToOne</span>, carregamento preguiçoso e
              o problema N+1. Consultas derivadas do nome do método e{" "}
              <span className="mono">@Query</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">06</div>
          <div className="body">
            <h3>Camada de serviço e transações</h3>
            <p>
              Onde a regra de negócio mora. <span className="mono">@Service</span>,{" "}
              <span className="mono">@Transactional</span> e por que o
              controller deve ser burro.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">07</div>
          <div className="body">
            <h3>Testes automatizados</h3>
            <p>
              Testes de unidade com JUnit 5 e Mockito, testes de camada web com{" "}
              <span className="mono">@WebMvcTest</span> e de integração com{" "}
              <span className="mono">@SpringBootTest</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">08</div>
          <div className="body">
            <h3>Paginação, ordenação e filtros</h3>
            <p>
              <span className="mono">Pageable</span>,{" "}
              <span className="mono">Sort</span> e filtros dinâmicos. Como não
              devolver 10 mil registros de uma vez.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">09</div>
          <div className="body">
            <h3>Banco de verdade e migrations</h3>
            <p>
              Trocar o H2 por PostgreSQL. Versionar o schema com Flyway e por
              que <span className="mono">ddl-auto: update</span> não vai pra
              produção.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">10</div>
          <div className="body">
            <h3>Consumindo outras APIs</h3>
            <p>
              Sua aplicação como cliente:{" "}
              <span className="mono">RestClient</span>, tratamento de falha,
              tempo limite e o que fazer quando o serviço do outro lado cai.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">11</div>
          <div className="body">
            <h3>Spring Security: autenticação</h3>
            <p>
              A cadeia de filtros, <span className="mono">UserDetailsService</span>,
              senhas com BCrypt e as rotas que ficam abertas.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">12</div>
          <div className="body">
            <h3>JWT e autorização por perfil</h3>
            <p>
              Emitir e validar token, filtro de autenticação e controle de
              acesso por papel com{" "}
              <span className="mono">@PreAuthorize</span>.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">13</div>
          <div className="body">
            <h3>Documentação com OpenAPI</h3>
            <p>
              Swagger UI gerado do código, descrição dos endpoints e exemplos —
              a API que outra pessoa consegue usar sem te perguntar nada.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">14</div>
          <div className="body">
            <h3>Configuração e perfis</h3>
            <p>
              <span className="mono">application.yml</span>, perfis (dev, test,
              prod), variáveis de ambiente e segredo que não vai pro Git.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">15</div>
          <div className="body">
            <h3>Cache, agendamento e tarefas assíncronas</h3>
            <p>
              <span className="mono">@Cacheable</span> pra não repetir consulta
              cara, <span className="mono">@Scheduled</span> pra rotina que roda
              sozinha e <span className="mono">@Async</span> pra não deixar quem
              chamou esperando.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">16</div>
          <div className="body">
            <h3>Observabilidade</h3>
            <p>
              Actuator, health check, métricas e logs que servem pra alguma
              coisa quando o sistema quebra às 3 da manhã.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">17</div>
          <div className="body">
            <h3>Docker e deploy</h3>
            <p>
              Empacotar a aplicação em imagem, subir banco com Docker Compose e
              publicar numa nuvem.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>

        <div className="lesson soon">
          <div className="idx">18</div>
          <div className="body">
            <h3>Apresentações e encerramento</h3>
            <p>
              Demonstração das APIs construídas, revisão geral e por onde seguir
              depois daqui.
            </p>
            <span className="soon-tag">em breve</span>
          </div>
        </div>
      </div>

      <Footer withHome />
    </>
  );
}
