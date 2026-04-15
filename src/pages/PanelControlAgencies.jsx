import { useEffect, useMemo, useState } from "react";

import PrimaryHeader from "../components/layout/PrimaryHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import LoadingState from "../components/common/LoadingState";
import DashboardSidebar from "../components/panel-control/DashboardSidebar";
import Footer from "../components/resultados/Footer";
import { usePanelSession } from "../contexts/PanelSessionContext";
import {
  footerData,
  panelControlMenu,
  panelControlProfile,
} from "../data/panelControlData";
import {
  createAgencyInSupabase,
  fetchAgenciesFromSupabase,
  updateAgencyInSupabase,
} from "../services/agencies/adminAgencies";

function createAgencyFormState() {
  return {
    city: "",
    contactEmail: "",
    contactPhone: "",
    legalRepresentativeCargo: "",
    legalRepresentativeEmail: "",
    legalRepresentativeName: "",
    name: "",
    nit: "",
    schedule: "",
    status: "active",
    tipoPersona: "juridica",
    type: "provider",
  };
}

function createAgencyEditFormState(agency) {
  return {
    city: agency?.city || "",
    contactEmail: agency?.contactEmail || "",
    contactPhone: agency?.contactPhone || "",
    id: agency?.id || "",
    legalRepresentativeCargo: agency?.legalRepresentativeCargo || "",
    legalRepresentativeEmail: agency?.legalRepresentativeEmail || "",
    legalRepresentativeName: agency?.legalRepresentativeName || "",
    name: agency?.name || "",
    nit: agency?.nit || "",
    schedule: agency?.schedule || "",
    status: agency?.status || "active",
    tipoPersona: agency?.tipoPersona || "juridica",
    type: agency?.type || "provider",
  };
}

function normalizeValue(value) {
  return String(value ?? "").toLowerCase().trim();
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function formatAgencyTypeLabel(type) {
  return type === "provider" ? "Agencia proveedora" : "Agencia vendedora";
}

function formatStatusLabel(status) {
  return status === "active" ? "Activa" : "Inactiva";
}

export default function PanelControlAgenciesPage() {
  const { profile, isProfileLoading } = usePanelSession();
  const [agencies, setAgencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formState, setFormState] = useState(() => createAgencyFormState());
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [isCreatingAgency, setIsCreatingAgency] = useState(false);
  const [isCreateAgencyModalOpen, setIsCreateAgencyModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [editFormState, setEditFormState] = useState(null);
  const [editFormError, setEditFormError] = useState("");
  const [isAgencyViewModalOpen, setIsAgencyViewModalOpen] = useState(false);
  const [isAgencyEditModalOpen, setIsAgencyEditModalOpen] = useState(false);
  const [isUpdatingAgency, setIsUpdatingAgency] = useState(false);
  const normalizedSearchTerm = normalizeValue(searchTerm);
  const isSuperUser = profile?.role === "super_user";

  useEffect(() => {
    if (isProfileLoading || !isSuperUser) {
      setIsLoadingPage(false);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingPage(true);
    setPageError("");

    fetchAgenciesFromSupabase()
      .then((nextAgencies) => {
        if (!isMounted) {
          return;
        }

        setAgencies(nextAgencies);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setAgencies([]);
        setPageError(
          error?.message ||
            "No fue posible cargar el directorio de agencias desde Supabase.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPage(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isProfileLoading, isSuperUser]);

  const filteredAgencies = useMemo(
    () =>
      agencies.filter((agency) => {
        const searchable = [
          agency.name,
          agency.nit,
          agency.city,
          agency.contactEmail,
          agency.legalRepresentativeName,
        ]
          .map(normalizeValue)
          .join(" ");

        const matchesSearch =
          !normalizedSearchTerm || searchable.includes(normalizedSearchTerm);
        const matchesType =
          selectedType === "all" || agency.type === selectedType;
        const matchesStatus =
          selectedStatus === "all" || agency.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
      }),
    [agencies, normalizedSearchTerm, selectedStatus, selectedType],
  );

  const stats = useMemo(
    () => ({
      active: agencies.filter((agency) => agency.status === "active").length,
      providers: agencies.filter((agency) => agency.type === "provider").length,
      sellers: agencies.filter((agency) => agency.type === "seller").length,
    }),
    [agencies],
  );

  function handleFormChange(field, value) {
    setFormError("");
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateAgencyModal() {
    setFormError("");
    setFormNotice("");
    setIsCreateAgencyModalOpen(true);
  }

  function closeCreateAgencyModal() {
    if (isCreatingAgency) {
      return;
    }

    setIsCreateAgencyModalOpen(false);
  }

  function openAgencyViewModal(agency) {
    setSelectedAgency(agency);
    setIsAgencyViewModalOpen(true);
  }

  function closeAgencyViewModal() {
    setIsAgencyViewModalOpen(false);
  }

  function openAgencyEditModal(agency) {
    setSelectedAgency(agency);
    setEditFormError("");
    setEditFormState(createAgencyEditFormState(agency));
    setIsAgencyEditModalOpen(true);
  }

  function closeAgencyEditModal() {
    if (isUpdatingAgency) {
      return;
    }

    setIsAgencyEditModalOpen(false);
  }

  function handleEditFormChange(field, value) {
    setEditFormError("");
    setEditFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateAgency(event) {
    event.preventDefault();

    try {
      setIsCreatingAgency(true);
      setFormError("");

      const createdAgency = await createAgencyInSupabase(formState);

      setAgencies((current) => [createdAgency, ...current]);
      setFormState(createAgencyFormState());
      setIsCreateAgencyModalOpen(false);
      setFormNotice("Agencia creada correctamente en Supabase.");
    } catch (error) {
      setFormError(
        error?.message ||
          "No fue posible crear la agencia en Supabase. Intenta de nuevo.",
      );
    } finally {
      setIsCreatingAgency(false);
    }
  }

  async function handleUpdateAgency(event) {
    event.preventDefault();

    try {
      setIsUpdatingAgency(true);
      setEditFormError("");
      setFormNotice("");

      const updatedAgency = await updateAgencyInSupabase(editFormState);

      setAgencies((current) =>
        current.map((agency) =>
          agency.id === updatedAgency.id ? updatedAgency : agency,
        ),
      );
      setSelectedAgency(updatedAgency);
      setIsAgencyEditModalOpen(false);
      setFormNotice("Agencia actualizada correctamente.");
    } catch (error) {
      setEditFormError(
        error?.message ||
          "No fue posible actualizar la agencia en Supabase. Intenta de nuevo.",
      );
    } finally {
      setIsUpdatingAgency(false);
    }
  }

  if (isProfileLoading || isLoadingPage) {
    return (
      <div className="panel-control-page">
        <PrimaryHeader />
        <main className="panel-control-main">
          <div className="panel-control-layout">
            <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />
            <section className="panel-control-content">
              <LoadingState
                title="Cargando agencias LDS"
                description="Estamos preparando el directorio administrativo de agencias."
              />
            </section>
          </div>
        </main>
        <Footer data={footerData} />
      </div>
    );
  }

  if (!isSuperUser) {
    return (
      <div className="panel-control-page">
        <PrimaryHeader />
        <main className="panel-control-main">
          <div className="panel-control-layout">
            <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />
            <section className="panel-control-content panel-control-users-page">
              <section className="panel-control-card panel-control-users-guard">
                <p>Administracion de agencias</p>
                <h1>Acceso reservado para Super User</h1>
                <span>
                  Solo LDS puede crear y gestionar agencias proveedoras o vendedoras
                  desde este modulo.
                </span>
              </section>
            </section>
          </div>
        </main>
        <Footer data={footerData} />
      </div>
    );
  }

  return (
    <div className="panel-control-page">
      <PrimaryHeader />

      <main className="panel-control-main">
        <div className="panel-control-layout">
          <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />

          <section className="panel-control-content panel-control-users-page">
            <header className="panel-control-users-hero">
              <div className="panel-control-users-hero-copy">
                <p>Administracion de agencias</p>
                <h1>Crea agencias proveedoras y vendedoras</h1>
                <span>
                  Este modulo le da a LDS el control base sobre las agencias que
                  van entrando al ecosistema del panel.
                </span>
              </div>

              <div className="panel-control-users-hero-badge">
                <strong>{agencies.length}</strong>
                <span>Agencias registradas</span>
              </div>
            </header>

            <section className="panel-control-users-overview-grid">
              <article className="panel-control-users-overview-card">
                <span>Agencias activas</span>
                <strong>{stats.active}</strong>
                <p>Agencias listas hoy para operar dentro de LDS.</p>
              </article>
              <article className="panel-control-users-overview-card">
                <span>Proveedoras</span>
                <strong>{stats.providers}</strong>
                <p>Empresas que publican y operan productos turisticos.</p>
              </article>
              <article className="panel-control-users-overview-card">
                <span>Vendedoras</span>
                <strong>{stats.sellers}</strong>
                <p>Agencias que comercializan inventario dentro del sistema.</p>
              </article>
            </section>

            <div className="panel-control-users-grid">
              <section className="panel-control-card panel-control-users-table-card">
                <div className="panel-control-users-section-head">
                  <div>
                    <p>Agencias LDS</p>
                    <h2>Directorio actual</h2>
                  </div>
                  <div className="panel-control-users-section-actions">
                    <small>{filteredAgencies.length} visibles</small>
                    <button
                      type="button"
                      className="panel-control-products-create"
                      onClick={openCreateAgencyModal}
                    >
                      <span className="material-icons-outlined" aria-hidden="true">
                        add_business
                      </span>
                      <span>Nueva agencia</span>
                    </button>
                  </div>
                </div>

                {formNotice ? (
                  <p className="panel-control-users-feedback panel-control-users-feedback--success">
                    {formNotice}
                  </p>
                ) : null}

                <div className="panel-control-users-filters">
                  <label className="panel-control-users-field panel-control-users-field--search">
                    <span>Buscar agencia</span>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Busca por nombre, NIT, ciudad o representante"
                    />
                  </label>

                  <label className="panel-control-users-field">
                    <span>Tipo</span>
                    <select
                      value={selectedType}
                      onChange={(event) => setSelectedType(event.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="provider">Proveedoras</option>
                      <option value="seller">Vendedoras</option>
                    </select>
                  </label>

                  <label className="panel-control-users-field">
                    <span>Estado</span>
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </label>
                </div>

                {pageError ? (
                  <div className="panel-control-reservations-empty">
                    <strong>No pudimos cargar las agencias.</strong>
                    <p>{pageError}</p>
                  </div>
                ) : filteredAgencies.length === 0 ? (
                  <div className="panel-control-reservations-empty">
                    <strong>No hay agencias para mostrar.</strong>
                    <p>
                      Ajusta los filtros o crea la primera agencia para seguir
                      estructurando LDS.
                    </p>
                  </div>
                ) : (
                  <div className="panel-control-users-table-shell">
                    <div className="panel-control-users-table-head">
                      <span>Agencia</span>
                      <span>Tipo</span>
                      <span>Contacto</span>
                      <span>Representante legal</span>
                      <span>Creado</span>
                      <span>Acciones</span>
                    </div>

                    <div className="panel-control-users-table-body">
                      {filteredAgencies.map((agency) => (
                        <article className="panel-control-users-table-row" key={agency.id}>
                          <div>
                            <strong>{agency.name}</strong>
                            <small>NIT: {agency.nit}</small>
                          </div>

                          <div>
                            <strong>{formatAgencyTypeLabel(agency.type)}</strong>
                            <small>{formatStatusLabel(agency.status)}</small>
                          </div>

                          <div>
                            <strong>{agency.contactEmail || "Sin correo"}</strong>
                            <small>
                              {[agency.contactPhone, agency.city].filter(Boolean).join(" - ") ||
                                "Sin datos de contacto"}
                            </small>
                          </div>

                          <div>
                            <strong>{agency.legalRepresentativeName || "Sin registrar"}</strong>
                            <small>
                              {[agency.legalRepresentativeCargo, agency.legalRepresentativeEmail]
                                .filter(Boolean)
                                .join(" - ") || "Sin detalle legal"}
                            </small>
                          </div>

                          <div>
                            <strong>{formatDateTimeLabel(agency.createdAt)}</strong>
                            <small>ID: {agency.id.slice(0, 8)}</small>
                          </div>

                          <div className="panel-control-users-row-actions">
                            <button
                              type="button"
                              className="panel-control-users-row-action"
                              onClick={() => openAgencyViewModal(agency)}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="panel-control-users-row-action panel-control-users-row-action--primary"
                              onClick={() => openAgencyEditModal(agency)}
                            >
                              Editar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </main>

      <Footer data={footerData} />

      {isCreateAgencyModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeCreateAgencyModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-agencies-create-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeCreateAgencyModal}
              aria-label="Cerrar formulario de agencia"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Nueva agencia</p>
            <h3 id="panel-control-agencies-create-title">
              Crear agencia proveedora o vendedora
            </h3>
            <span>
              Registra la agencia base en Supabase y, si ya lo tienes, deja tambien
              el primer contacto del representante legal.
            </span>

            <form className="panel-control-users-form" onSubmit={handleCreateAgency}>
              <div className="panel-control-users-form-grid">
                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Nombre de la agencia</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => handleFormChange("name", event.target.value)}
                    placeholder="Ejemplo: LDS Proveedor"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Tipo de agencia</span>
                  <select
                    value={formState.type}
                    onChange={(event) => handleFormChange("type", event.target.value)}
                  >
                    <option value="provider">Agencia proveedora</option>
                    <option value="seller">Agencia vendedora</option>
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>Tipo de persona</span>
                  <select
                    value={formState.tipoPersona}
                    onChange={(event) =>
                      handleFormChange("tipoPersona", event.target.value)
                    }
                  >
                    <option value="juridica">Juridica</option>
                    <option value="fisica">Fisica</option>
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>NIT</span>
                  <input
                    type="text"
                    value={formState.nit}
                    onChange={(event) => handleFormChange("nit", event.target.value)}
                    placeholder="900123456-7"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Estado inicial</span>
                  <select
                    value={formState.status}
                    onChange={(event) => handleFormChange("status", event.target.value)}
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>Ciudad</span>
                  <input
                    type="text"
                    value={formState.city}
                    onChange={(event) => handleFormChange("city", event.target.value)}
                    placeholder="Bogota"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Horario de atencion</span>
                  <input
                    type="text"
                    value={formState.schedule}
                    onChange={(event) => handleFormChange("schedule", event.target.value)}
                    placeholder="Lun a Vie - 8:00 AM a 5:00 PM"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Correo de contacto</span>
                  <input
                    type="email"
                    value={formState.contactEmail}
                    onChange={(event) =>
                      handleFormChange("contactEmail", event.target.value)
                    }
                    placeholder="contacto@agencia.com"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Telefono</span>
                  <input
                    type="tel"
                    value={formState.contactPhone}
                    onChange={(event) =>
                      handleFormChange("contactPhone", event.target.value)
                    }
                    placeholder="3001234567"
                  />
                </label>

                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Representante legal</span>
                  <input
                    type="text"
                    value={formState.legalRepresentativeName}
                    onChange={(event) =>
                      handleFormChange("legalRepresentativeName", event.target.value)
                    }
                    placeholder="Nombre completo"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Cargo</span>
                  <input
                    type="text"
                    value={formState.legalRepresentativeCargo}
                    onChange={(event) =>
                      handleFormChange("legalRepresentativeCargo", event.target.value)
                    }
                    placeholder="Gerente general"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Email representante</span>
                  <input
                    type="email"
                    value={formState.legalRepresentativeEmail}
                    onChange={(event) =>
                      handleFormChange("legalRepresentativeEmail", event.target.value)
                    }
                    placeholder="representante@agencia.com"
                  />
                </label>
              </div>

              {formError ? (
                <p className="panel-control-users-feedback panel-control-users-feedback--error">
                  {formError}
                </p>
              ) : null}

              <div className="detalle-producto-admin-modal-actions">
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                  onClick={closeCreateAgencyModal}
                  disabled={isCreatingAgency}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isCreatingAgency}
                >
                  <span className="lds-button-content">
                    {isCreatingAgency ? (
                      <LoadingSpinner label="Creando agencia" size="sm" />
                    ) : (
                      <span className="material-icons-outlined" aria-hidden="true">
                        add_business
                      </span>
                    )}
                    <span>{isCreatingAgency ? "Creando..." : "Crear agencia"}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isAgencyViewModalOpen && selectedAgency ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeAgencyViewModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-agency-view-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeAgencyViewModal}
              aria-label="Cerrar vista de la agencia"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Agencia LDS</p>
            <h3 id="panel-control-agency-view-title">{selectedAgency.name}</h3>

            <div className="panel-control-users-detail-grid">
              <article className="panel-control-users-detail-card">
                <span>Tipo</span>
                <strong>{formatAgencyTypeLabel(selectedAgency.type)}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Estado</span>
                <strong>{formatStatusLabel(selectedAgency.status)}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>NIT</span>
                <strong>{selectedAgency.nit}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Ciudad</span>
                <strong>{selectedAgency.city || "Sin ciudad"}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Contacto</span>
                <strong>{selectedAgency.contactEmail || "Sin correo"}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Telefono</span>
                <strong>{selectedAgency.contactPhone || "Sin telefono"}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Representante legal</span>
                <strong>
                  {selectedAgency.legalRepresentativeName || "Sin registrar"}
                </strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Creado</span>
                <strong>{formatDateTimeLabel(selectedAgency.createdAt)}</strong>
              </article>
            </div>
          </div>
        </div>
      ) : null}

      {isAgencyEditModalOpen && editFormState ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeAgencyEditModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-agency-edit-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeAgencyEditModal}
              aria-label="Cerrar edicion de la agencia"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Editar agencia</p>
            <h3 id="panel-control-agency-edit-title">
              Actualiza la informacion de {selectedAgency?.name}
            </h3>

            <form className="panel-control-users-form" onSubmit={handleUpdateAgency}>
              <div className="panel-control-users-form-grid">
                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Nombre de la agencia</span>
                  <input
                    type="text"
                    value={editFormState.name}
                    onChange={(event) => handleEditFormChange("name", event.target.value)}
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Tipo de agencia</span>
                  <select
                    value={editFormState.type}
                    onChange={(event) => handleEditFormChange("type", event.target.value)}
                  >
                    <option value="provider">Agencia proveedora</option>
                    <option value="seller">Agencia vendedora</option>
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>Tipo de persona</span>
                  <select
                    value={editFormState.tipoPersona}
                    onChange={(event) =>
                      handleEditFormChange("tipoPersona", event.target.value)
                    }
                  >
                    <option value="juridica">Juridica</option>
                    <option value="fisica">Fisica</option>
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>NIT</span>
                  <input
                    type="text"
                    value={editFormState.nit}
                    onChange={(event) => handleEditFormChange("nit", event.target.value)}
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Estado</span>
                  <select
                    value={editFormState.status}
                    onChange={(event) =>
                      handleEditFormChange("status", event.target.value)
                    }
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>Ciudad</span>
                  <input
                    type="text"
                    value={editFormState.city}
                    onChange={(event) => handleEditFormChange("city", event.target.value)}
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Horario de atencion</span>
                  <input
                    type="text"
                    value={editFormState.schedule}
                    onChange={(event) =>
                      handleEditFormChange("schedule", event.target.value)
                    }
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Correo de contacto</span>
                  <input
                    type="email"
                    value={editFormState.contactEmail}
                    onChange={(event) =>
                      handleEditFormChange("contactEmail", event.target.value)
                    }
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Telefono</span>
                  <input
                    type="tel"
                    value={editFormState.contactPhone}
                    onChange={(event) =>
                      handleEditFormChange("contactPhone", event.target.value)
                    }
                  />
                </label>

                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Representante legal</span>
                  <input
                    type="text"
                    value={editFormState.legalRepresentativeName}
                    onChange={(event) =>
                      handleEditFormChange(
                        "legalRepresentativeName",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Cargo</span>
                  <input
                    type="text"
                    value={editFormState.legalRepresentativeCargo}
                    onChange={(event) =>
                      handleEditFormChange(
                        "legalRepresentativeCargo",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Email representante</span>
                  <input
                    type="email"
                    value={editFormState.legalRepresentativeEmail}
                    onChange={(event) =>
                      handleEditFormChange(
                        "legalRepresentativeEmail",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              {editFormError ? (
                <p className="panel-control-users-feedback panel-control-users-feedback--error">
                  {editFormError}
                </p>
              ) : null}

              <div className="detalle-producto-admin-modal-actions">
                <button
                  type="button"
                  className="detalle-producto-admin-modal-button detalle-producto-admin-modal-button--secondary"
                  onClick={closeAgencyEditModal}
                  disabled={isUpdatingAgency}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isUpdatingAgency}
                >
                  <span className="lds-button-content">
                    {isUpdatingAgency ? (
                      <LoadingSpinner label="Guardando agencia" size="sm" />
                    ) : (
                      <span className="material-icons-outlined" aria-hidden="true">
                        save
                      </span>
                    )}
                    <span>{isUpdatingAgency ? "Guardando..." : "Guardar cambios"}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
