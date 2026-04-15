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
  createPanelUserInSupabase,
  fetchAgencyOptionsFromSupabase,
  fetchPanelUsersFromSupabase,
  updatePanelUserInSupabase,
} from "../services/users/adminUsers";
import {
  DEFAULT_USER_PHOTO_FILENAME,
  resolveUserPhotoUrl,
} from "../utils/userPhotos";

function createUserFormState(defaultAgencyId = "") {
  return {
    agencyId: defaultAgencyId,
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    photoFilename: "",
    phone: "",
    role: "travel_agent",
    status: "active",
  };
}

function createUserEditFormState(user) {
  return {
    agencyId: user?.agencyId || "",
    email: user?.email || "",
    firstName: user?.firstName || "",
    id: user?.id || "",
    lastName: user?.lastName || "",
    photoFilename: user?.photoFilename || DEFAULT_USER_PHOTO_FILENAME,
    phone: user?.phone || "",
    role: user?.role || "travel_agent",
    status: user?.status || "active",
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

function formatRoleLabel(role) {
  if (role === "super_user") {
    return "Super User";
  }

  if (role === "agency_admin") {
    return "Agency Admin";
  }

  return "Travel Agent";
}

function formatStatusLabel(status) {
  return status === "active" ? "Activo" : "Inactivo";
}

export default function PanelControlUsersPage() {
  const { profile, isProfileLoading } = usePanelSession();
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formState, setFormState] = useState(() =>
    createUserFormState(profile?.agency_id || ""),
  );
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createdUserSummary, setCreatedUserSummary] = useState(null);
  const [editFormState, setEditFormState] = useState(null);
  const [editFormError, setEditFormError] = useState("");
  const [isUserViewModalOpen, setIsUserViewModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isUserCreatedModalOpen, setIsUserCreatedModalOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [createPhotoPreviewUrl, setCreatePhotoPreviewUrl] = useState("");
  const [editPhotoPreviewUrl, setEditPhotoPreviewUrl] = useState("");
  const normalizedSearchTerm = normalizeValue(searchTerm);
  const isSuperUser = profile?.role === "super_user";
  const isAgencyAdmin = profile?.role === "agency_admin";
  const canAccessUsersPanel = isSuperUser || isAgencyAdmin;
  const isScopedAgencyAdmin = isAgencyAdmin && !isSuperUser;

  useEffect(() => {
    return () => {
      if (createPhotoPreviewUrl) {
        URL.revokeObjectURL(createPhotoPreviewUrl);
      }

      if (editPhotoPreviewUrl) {
        URL.revokeObjectURL(editPhotoPreviewUrl);
      }
    };
  }, [createPhotoPreviewUrl, editPhotoPreviewUrl]);

  useEffect(() => {
    if (isProfileLoading || !canAccessUsersPanel) {
      setIsLoadingPage(false);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingPage(true);
    setPageError("");

    Promise.all([
      fetchPanelUsersFromSupabase(),
      fetchAgencyOptionsFromSupabase(),
    ])
      .then(([nextUsers, nextAgencies]) => {
        if (!isMounted) {
          return;
        }

        setUsers(nextUsers);
        setAgencies(nextAgencies);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setUsers([]);
        setAgencies([]);
        setPageError(
          error?.message ||
            "No fue posible cargar la administracion de usuarios desde Supabase.",
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
  }, [canAccessUsersPanel, isProfileLoading]);

  const visibleAgencies = useMemo(
    () =>
      agencies.filter((agency) => {
        if (agency.status !== "active") {
          return false;
        }

        if (isScopedAgencyAdmin) {
          return agency.id === (profile?.agency_id || "");
        }

        return true;
      }),
    [agencies, isScopedAgencyAdmin, profile?.agency_id],
  );

  const currentAgencyName =
    visibleAgencies.find((agency) => agency.id === (profile?.agency_id || ""))?.name ||
    "tu agencia";

  const scopedUsers = useMemo(
    () =>
      isScopedAgencyAdmin
        ? users.filter((user) => user.agencyId === (profile?.agency_id || ""))
        : users,
    [isScopedAgencyAdmin, profile?.agency_id, users],
  );

  const availableRoleOptions = useMemo(
    () =>
      isSuperUser
        ? [
            { value: "travel_agent", label: "Travel Agent" },
            { value: "agency_admin", label: "Agency Admin" },
            { value: "super_user", label: "Super User" },
          ]
        : [
            { value: "travel_agent", label: "Travel Agent" },
            { value: "agency_admin", label: "Agency Admin" },
          ],
    [isSuperUser],
  );

  const filteredUsers = useMemo(
    () =>
      scopedUsers.filter((user) => {
        const searchable = [
          user.fullName,
          user.email,
          user.agencyName,
          formatRoleLabel(user.role),
        ]
          .map(normalizeValue)
          .join(" ");

        const matchesSearch =
          !normalizedSearchTerm || searchable.includes(normalizedSearchTerm);
        const matchesRole =
          selectedRole === "all" || user.role === selectedRole;
        const matchesStatus =
          selectedStatus === "all" || user.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
      }),
    [normalizedSearchTerm, scopedUsers, selectedRole, selectedStatus],
  );

  const stats = useMemo(
    () => ({
      active: scopedUsers.filter((user) => user.status === "active").length,
      agencyAdmins: scopedUsers.filter((user) => user.role === "agency_admin").length,
      superUsers: scopedUsers.filter((user) => user.role === "super_user").length,
      travelAgents: scopedUsers.filter((user) => user.role === "travel_agent").length,
    }),
    [scopedUsers],
  );

  function handleFormChange(field, value) {
    setFormNotice("");
    setFormError("");
    setFormState((current) => {
      const nextState = {
        ...current,
        [field]: value,
      };

      if (field === "role" && value === "super_user") {
        nextState.agencyId = "";
      }

      if (isScopedAgencyAdmin) {
        nextState.agencyId = profile?.agency_id || "";
      }

      return nextState;
    });
  }

  function openCreateUserModal() {
    setFormError("");
    setFormNotice("");
    if (createPhotoPreviewUrl) {
      URL.revokeObjectURL(createPhotoPreviewUrl);
    }
    setCreatePhotoPreviewUrl("");
    setFormState(
      createUserFormState(isScopedAgencyAdmin ? profile?.agency_id || "" : ""),
    );
    setIsCreateUserModalOpen(true);
  }

  function closeCreateUserModal() {
    if (isCreatingUser) {
      return;
    }

    if (createPhotoPreviewUrl) {
      URL.revokeObjectURL(createPhotoPreviewUrl);
    }
    setCreatePhotoPreviewUrl("");
    setIsCreateUserModalOpen(false);
  }

  function closeUserCreatedModal() {
    setIsUserCreatedModalOpen(false);
  }

  function openUserViewModal(user) {
    setSelectedUser(user);
    setIsUserViewModalOpen(true);
  }

  function closeUserViewModal() {
    setIsUserViewModalOpen(false);
  }

  function openUserEditModal(user) {
    setSelectedUser(user);
    setEditFormError("");
    if (editPhotoPreviewUrl) {
      URL.revokeObjectURL(editPhotoPreviewUrl);
    }
    setEditPhotoPreviewUrl("");
    setEditFormState(createUserEditFormState(user));
    setIsUserEditModalOpen(true);
  }

  function closeUserEditModal() {
    if (isUpdatingUser) {
      return;
    }

    if (editPhotoPreviewUrl) {
      URL.revokeObjectURL(editPhotoPreviewUrl);
    }
    setEditPhotoPreviewUrl("");
    setIsUserEditModalOpen(false);
  }

  function handleEditFormChange(field, value) {
    setEditFormError("");
    setEditFormState((current) => {
      const nextState = {
        ...current,
        [field]: value,
      };

      if (field === "role" && value === "super_user") {
        nextState.agencyId = "";
      }

      if (isScopedAgencyAdmin) {
        nextState.agencyId = profile?.agency_id || "";
      }

      return nextState;
    });
  }

  function handleCreatePhotoChange(event) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (createPhotoPreviewUrl) {
      URL.revokeObjectURL(createPhotoPreviewUrl);
    }

    handleFormChange("photoFilename", nextFile.name || DEFAULT_USER_PHOTO_FILENAME);
    setCreatePhotoPreviewUrl(URL.createObjectURL(nextFile));
  }

  function handleEditPhotoChange(event) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (editPhotoPreviewUrl) {
      URL.revokeObjectURL(editPhotoPreviewUrl);
    }

    handleEditFormChange(
      "photoFilename",
      nextFile.name || DEFAULT_USER_PHOTO_FILENAME,
    );
    setEditPhotoPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    try {
      setIsCreatingUser(true);
      setFormError("");
      setFormNotice("");

      const createdUser = await createPanelUserInSupabase(formState);

      setUsers((current) => [createdUser, ...current]);
      if (createPhotoPreviewUrl) {
        URL.revokeObjectURL(createPhotoPreviewUrl);
      }
      setCreatePhotoPreviewUrl("");
      setFormState(
        createUserFormState(isScopedAgencyAdmin ? profile?.agency_id || "" : ""),
      );
      setFormNotice("Usuario creado correctamente y listo para usarse en LDS.");
      setCreatedUserSummary(createdUser);
      setIsCreateUserModalOpen(false);
      setIsUserCreatedModalOpen(true);
    } catch (error) {
      setFormError(
        error?.message ||
          "No fue posible crear el usuario en Supabase. Intenta de nuevo.",
      );
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleUpdateUser(event) {
    event.preventDefault();

    try {
      setIsUpdatingUser(true);
      setEditFormError("");
      setFormNotice("");

      const updatedUser = await updatePanelUserInSupabase(editFormState);

      setUsers((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );
      if (editPhotoPreviewUrl) {
        URL.revokeObjectURL(editPhotoPreviewUrl);
      }
      setEditPhotoPreviewUrl("");
      setSelectedUser(updatedUser);
      setIsUserEditModalOpen(false);
      setFormNotice("Usuario actualizado correctamente.");
    } catch (error) {
      setEditFormError(
        error?.message ||
          "No fue posible actualizar el usuario en Supabase. Intenta de nuevo.",
      );
    } finally {
      setIsUpdatingUser(false);
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
                title="Cargando usuarios LDS"
                description="Estamos preparando el panel de administracion de usuarios."
              />
            </section>
          </div>
        </main>
        <Footer data={footerData} />
      </div>
    );
  }

  if (!canAccessUsersPanel) {
    return (
      <div className="panel-control-page">
        <PrimaryHeader />
        <main className="panel-control-main">
          <div className="panel-control-layout">
            <DashboardSidebar menu={panelControlMenu} profile={panelControlProfile} />
            <section className="panel-control-content panel-control-users-page">
              <section className="panel-control-card panel-control-users-guard">
                <p>Administracion de usuarios</p>
                <h1>Acceso restringido</h1>
                <span>
                  Este modulo solo puede ser usado por perfiles administrativos
                  autorizados dentro del panel LDS.
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
                <p>Administracion de usuarios</p>
                <h1>
                  {isSuperUser
                    ? "Crea y organiza los usuarios de LDS"
                    : `Crea y organiza los usuarios de ${currentAgencyName}`}
                </h1>
                <span>
                  {isSuperUser
                    ? "Desde aqui el super usuario puede crear cuentas nuevas y ajustar roles y agencias a medida que evoluciona la operacion."
                    : "Desde aqui la agencia administra unicamente los usuarios que pertenecen a su propia operacion."}
                </span>
              </div>

              <div className="panel-control-users-hero-badge">
                <strong>{scopedUsers.length}</strong>
                <span>{isSuperUser ? "Usuarios registrados" : "Usuarios de tu agencia"}</span>
              </div>
            </header>

            <section className="panel-control-users-overview-grid">
              <article className="panel-control-users-overview-card">
                <span>Usuarios activos</span>
                <strong>{stats.active}</strong>
                <p>Cuentas habilitadas hoy dentro del panel de control.</p>
              </article>
              <article className="panel-control-users-overview-card">
                <span>Super users</span>
                <strong>{stats.superUsers}</strong>
                <p>Usuarios con capacidad global de administracion LDS.</p>
              </article>
              <article className="panel-control-users-overview-card">
                <span>Agency admins</span>
                <strong>{stats.agencyAdmins}</strong>
                <p>Usuarios responsables por agencias especificas.</p>
              </article>
              <article className="panel-control-users-overview-card">
                <span>Travel agents</span>
                <strong>{stats.travelAgents}</strong>
                <p>Perfiles comerciales y operativos vinculados a agencia.</p>
              </article>
            </section>

            <div className="panel-control-users-grid">
              <section className="panel-control-card panel-control-users-table-card">
                <div className="panel-control-users-section-head">
                  <div>
                    <p>Usuarios LDS</p>
                    <h2>Directorio actual</h2>
                  </div>
                  <div className="panel-control-users-section-actions">
                    <small>{filteredUsers.length} visibles</small>
                    <button
                      type="button"
                      className="panel-control-products-create"
                      onClick={openCreateUserModal}
                    >
                      <span className="material-icons-outlined" aria-hidden="true">
                        person_add
                      </span>
                      <span>Nuevo usuario</span>
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
                    <span>Buscar usuario</span>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Busca por nombre, correo o agencia"
                    />
                  </label>

                  <label className="panel-control-users-field">
                    <span>Rol</span>
                    <select
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value)}
                    >
                      <option value="all">Todos</option>
                      {isSuperUser ? <option value="super_user">Super User</option> : null}
                      <option value="agency_admin">Agency Admin</option>
                      <option value="travel_agent">Travel Agent</option>
                    </select>
                  </label>

                  <label className="panel-control-users-field">
                    <span>Estado</span>
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </label>
                </div>

                {pageError ? (
                  <div className="panel-control-reservations-empty">
                    <strong>No pudimos cargar los usuarios.</strong>
                    <p>{pageError}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="panel-control-reservations-empty">
                    <strong>No hay usuarios para mostrar.</strong>
                    <p>
                      Ajusta los filtros o crea el primer usuario para esta nueva
                      fase de LDS.
                    </p>
                  </div>
                ) : (
                  <div className="panel-control-users-table-shell">
                    <div className="panel-control-users-table-head">
                      <span>Usuario</span>
                      <span>Agencia</span>
                      <span>Rol</span>
                      <span>Estado</span>
                      <span>Creado</span>
                      <span>Acciones</span>
                    </div>

                    <div className="panel-control-users-table-body">
                      {filteredUsers.map((user) => (
                        <article className="panel-control-users-table-row" key={user.id}>
                          <div>
                            <strong>{user.fullName}</strong>
                            <small>{user.email}</small>
                          </div>

                          <div>
                            <strong>{user.agencyName}</strong>
                            <small>
                              {user.agencyType === "provider"
                                ? "Agencia proveedora"
                                : user.agencyType === "seller"
                                  ? "Agencia vendedora"
                                  : "Sin asignar"}
                            </small>
                          </div>

                          <div>
                            <strong>{formatRoleLabel(user.role)}</strong>
                            <small>{user.phone || "Sin telefono"}</small>
                          </div>

                          <div>
                            <strong>{formatStatusLabel(user.status)}</strong>
                            <small>{user.role === "super_user" ? "Global" : "Panel"}</small>
                          </div>

                          <div>
                            <strong>{formatDateTimeLabel(user.createdAt)}</strong>
                            <small>ID: {user.id.slice(0, 8)}</small>
                          </div>

                          <div className="panel-control-users-row-actions">
                            <button
                              type="button"
                              className="panel-control-users-row-action"
                              onClick={() => openUserViewModal(user)}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="panel-control-users-row-action panel-control-users-row-action--primary"
                              onClick={() => openUserEditModal(user)}
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

      {isCreateUserModalOpen ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeCreateUserModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-users-create-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeCreateUserModal}
              aria-label="Cerrar formulario de usuario"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Nuevo usuario</p>
            <h3 id="panel-control-users-create-title">Crear cuenta en Supabase</h3>
            <span>
              Crea un usuario nuevo para el panel LDS y define desde ahora su rol,
              estado y agencia asociada.
            </span>

            <form className="panel-control-users-form" onSubmit={handleCreateUser}>
              <div className="panel-control-users-form-grid">
                <label className="panel-control-users-field">
                  <span>Nombres</span>
                  <input
                    type="text"
                    value={formState.firstName}
                    onChange={(event) =>
                      handleFormChange("firstName", event.target.value)
                    }
                    placeholder="Ejemplo: Laura"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Apellidos</span>
                  <input
                    type="text"
                    value={formState.lastName}
                    onChange={(event) =>
                      handleFormChange("lastName", event.target.value)
                    }
                    placeholder="Ejemplo: Ramirez"
                  />
                </label>

                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Correo electronico</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      handleFormChange("email", event.target.value)
                    }
                    placeholder="usuario@agencia.com"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Clave temporal</span>
                  <input
                    type="password"
                    value={formState.password}
                    onChange={(event) =>
                      handleFormChange("password", event.target.value)
                    }
                    placeholder="Minimo 8 caracteres"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Telefono</span>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(event) =>
                      handleFormChange("phone", event.target.value)
                    }
                    placeholder="3001234567"
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Foto de perfil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCreatePhotoChange}
                  />
                </label>

                <article className="panel-control-users-photo-card">
                  <span>Vista previa</span>
                  <img
                    alt="Vista previa del usuario"
                    src={
                      createPhotoPreviewUrl ||
                      resolveUserPhotoUrl(
                        formState.photoFilename || DEFAULT_USER_PHOTO_FILENAME,
                      )
                    }
                  />
                  <small>
                    Elige la imagen desde
                    {" "}
                    <strong>public/images/user</strong>.
                    {" "}
                    Si no escoges una, LDS usara
                    <strong> {DEFAULT_USER_PHOTO_FILENAME}</strong>.
                  </small>
                  <small>
                    Archivo actual:
                    {" "}
                    <strong>
                      {formState.photoFilename || DEFAULT_USER_PHOTO_FILENAME}
                    </strong>
                  </small>
                </article>

                <label className="panel-control-users-field">
                  <span>Rol</span>
                  <select
                    value={formState.role}
                    onChange={(event) =>
                      handleFormChange("role", event.target.value)
                    }
                  >
                    {availableRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>Estado inicial</span>
                  <select
                    value={formState.status}
                    onChange={(event) =>
                      handleFormChange("status", event.target.value)
                    }
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </label>

                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Agencia</span>
                  <select
                    value={formState.agencyId}
                    onChange={(event) =>
                      handleFormChange("agencyId", event.target.value)
                    }
                    disabled={formState.role === "super_user" || isScopedAgencyAdmin}
                  >
                    <option value="">
                      {formState.role === "super_user"
                        ? "No aplica para Super User"
                        : isScopedAgencyAdmin
                          ? "Tu agencia actual"
                        : "Selecciona una agencia"}
                    </option>
                    {visibleAgencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name} -{" "}
                        {agency.type === "provider" ? "Proveedor" : "Vendedora"}
                        {agency.city ? ` - ${agency.city}` : ""}
                      </option>
                    ))}
                  </select>
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
                  onClick={closeCreateUserModal}
                  disabled={isCreatingUser}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isCreatingUser}
                >
                  <span className="lds-button-content">
                    {isCreatingUser ? (
                      <LoadingSpinner label="Creando usuario" size="sm" />
                    ) : (
                      <span className="material-icons-outlined" aria-hidden="true">
                        person_add
                      </span>
                    )}
                    <span>{isCreatingUser ? "Creando..." : "Crear usuario"}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isUserViewModalOpen && selectedUser ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeUserViewModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-user-view-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeUserViewModal}
              aria-label="Cerrar vista del usuario"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Usuario LDS</p>
            <h3 id="panel-control-user-view-title">{selectedUser.fullName}</h3>

            <div className="panel-control-users-detail-grid">
              <article className="panel-control-users-detail-card panel-control-users-detail-card--photo">
                <span>Foto</span>
                <img
                  alt={selectedUser.fullName}
                  className="panel-control-users-detail-photo"
                  src={selectedUser.photoUrl}
                />
              </article>
              <article className="panel-control-users-detail-card">
                <span>Correo</span>
                <strong>{selectedUser.email}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Rol</span>
                <strong>{formatRoleLabel(selectedUser.role)}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Estado</span>
                <strong>{formatStatusLabel(selectedUser.status)}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Agencia</span>
                <strong>{selectedUser.agencyName}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Telefono</span>
                <strong>{selectedUser.phone || "Sin telefono"}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Creado</span>
                <strong>{formatDateTimeLabel(selectedUser.createdAt)}</strong>
              </article>
            </div>
          </div>
        </div>
      ) : null}

      {isUserEditModalOpen && editFormState ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeUserEditModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-user-edit-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeUserEditModal}
              aria-label="Cerrar edicion del usuario"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Editar usuario</p>
            <h3 id="panel-control-user-edit-title">
              Actualiza la cuenta de {selectedUser?.fullName}
            </h3>

            <form className="panel-control-users-form" onSubmit={handleUpdateUser}>
              <div className="panel-control-users-form-grid">
                <label className="panel-control-users-field">
                  <span>Nombres</span>
                  <input
                    type="text"
                    value={editFormState.firstName}
                    onChange={(event) =>
                      handleEditFormChange("firstName", event.target.value)
                    }
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Apellidos</span>
                  <input
                    type="text"
                    value={editFormState.lastName}
                    onChange={(event) =>
                      handleEditFormChange("lastName", event.target.value)
                    }
                  />
                </label>

                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Correo electronico</span>
                  <input type="email" value={editFormState.email} disabled />
                </label>

                <label className="panel-control-users-field">
                  <span>Telefono</span>
                  <input
                    type="tel"
                    value={editFormState.phone}
                    onChange={(event) =>
                      handleEditFormChange("phone", event.target.value)
                    }
                  />
                </label>

                <label className="panel-control-users-field">
                  <span>Foto de perfil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoChange}
                  />
                </label>

                <article className="panel-control-users-photo-card">
                  <span>Vista previa</span>
                  <img
                    alt="Vista previa del usuario"
                    src={
                      editPhotoPreviewUrl ||
                      resolveUserPhotoUrl(editFormState.photoFilename)
                    }
                  />
                  <small>
                    Elige la imagen desde
                    {" "}
                    <strong>public/images/user</strong>
                    {" "}
                    y LDS guardara solo el filename.
                  </small>
                  <small>
                    Archivo actual:
                    {" "}
                    <strong>{editFormState.photoFilename}</strong>
                  </small>
                </article>

                <label className="panel-control-users-field">
                  <span>Rol</span>
                  <select
                    value={editFormState.role}
                    onChange={(event) =>
                      handleEditFormChange("role", event.target.value)
                    }
                  >
                    {availableRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="panel-control-users-field">
                  <span>Estado</span>
                  <select
                    value={editFormState.status}
                    onChange={(event) =>
                      handleEditFormChange("status", event.target.value)
                    }
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </label>

                <label className="panel-control-users-field panel-control-users-field--full">
                  <span>Agencia</span>
                  <select
                    value={editFormState.agencyId}
                    onChange={(event) =>
                      handleEditFormChange("agencyId", event.target.value)
                    }
                    disabled={editFormState.role === "super_user" || isScopedAgencyAdmin}
                  >
                    <option value="">
                      {editFormState.role === "super_user"
                        ? "No aplica para Super User"
                        : isScopedAgencyAdmin
                          ? "Tu agencia actual"
                        : "Selecciona una agencia"}
                    </option>
                    {visibleAgencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name} -{" "}
                        {agency.type === "provider" ? "Proveedor" : "Vendedora"}
                        {agency.city ? ` - ${agency.city}` : ""}
                      </option>
                    ))}
                  </select>
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
                  onClick={closeUserEditModal}
                  disabled={isUpdatingUser}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-producto-admin-modal-button"
                  disabled={isUpdatingUser}
                >
                  <span className="lds-button-content">
                    {isUpdatingUser ? (
                      <LoadingSpinner label="Guardando usuario" size="sm" />
                    ) : (
                      <span className="material-icons-outlined" aria-hidden="true">
                        save
                      </span>
                    )}
                    <span>{isUpdatingUser ? "Guardando..." : "Guardar cambios"}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isUserCreatedModalOpen && createdUserSummary ? (
        <div
          className="detalle-producto-admin-modal-backdrop"
          onClick={closeUserCreatedModal}
          role="presentation"
        >
          <div
            className="detalle-producto-admin-modal panel-control-users-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-control-user-created-title"
          >
            <button
              type="button"
              className="detalle-producto-admin-modal-close"
              onClick={closeUserCreatedModal}
              aria-label="Cerrar confirmacion del usuario"
            >
              <span className="material-icons-outlined">close</span>
            </button>

            <p>Usuario creado</p>
            <h3 id="panel-control-user-created-title">
              La cuenta ya quedo lista para usarse en LDS
            </h3>
            <span>
              El nuevo usuario fue creado correctamente y ya puede iniciar sesion
              con la clave temporal definida.
            </span>

            <div className="panel-control-users-detail-grid">
              <article className="panel-control-users-detail-card panel-control-users-detail-card--photo">
                <span>Foto</span>
                <img
                  alt={createdUserSummary.fullName}
                  className="panel-control-users-detail-photo"
                  src={createdUserSummary.photoUrl}
                />
              </article>
              <article className="panel-control-users-detail-card">
                <span>Usuario</span>
                <strong>{createdUserSummary.fullName}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Correo</span>
                <strong>{createdUserSummary.email}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Rol</span>
                <strong>{formatRoleLabel(createdUserSummary.role)}</strong>
              </article>
              <article className="panel-control-users-detail-card">
                <span>Agencia</span>
                <strong>{createdUserSummary.agencyName}</strong>
              </article>
            </div>

            <div className="detalle-producto-admin-modal-actions">
              <button
                type="button"
                className="detalle-producto-admin-modal-button"
                onClick={closeUserCreatedModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
