import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import AdminIcon from "../components/admin/AdminIcon";
import AdminOverview from "../components/admin/AdminOverview";
import AdminSidebar from "../components/admin/AdminSidebar";
import CustomerAdminForm from "../components/admin/CustomerAdminForm";
import ProductAdminForm from "../components/admin/ProductAdminForm";

import { useTechStore } from "../hooks/useTechStore";

import {
  createCustomer,
  createProduct,
} from "../services/api";

import "../styles/admin.css";


/* =========================================================
   FORMULARIO INICIAL DE PRODUCTO
   ========================================================= */

const initialProductForm = {
  active: true,
  category: "MONITORES",
  currency: "PEN",
  description: "",
  id: "",
  name: "",
  price: "",
  reservedStock: "0",
  stock: "",
};


/* =========================================================
   FORMULARIO INICIAL DE CLIENTE
   ========================================================= */

const initialCustomerForm = {
  active: true,
  address: "",
  documentNumber: "",
  documentType: "RUC",
  email: "",
  id: "",
  name: "",
  phone: "",
};


/* =========================================================
   HORA PARA ACTIVIDAD RECIENTE
   ========================================================= */

function getRecordTime() {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}


function AdminView() {
  const prefersReducedMotion = useReducedMotion();

  const {
    activeCustomers,
    activeProducts,
    refreshCustomers,
    refreshProducts,
  } = useTechStore();


  /* =========================================================
     ESTADO DE NAVEGACIÓN
     ========================================================= */

  const [activeSection, setActiveSection] = useState("overview");


  /* =========================================================
     ESTADO DE FORMULARIOS
     ========================================================= */

  const [productForm, setProductForm] =
    useState(initialProductForm);

  const [customerForm, setCustomerForm] =
    useState(initialCustomerForm);


  /* =========================================================
     ACTIVIDAD RECIENTE
     ========================================================= */

  const [records, setRecords] = useState([]);


  /* =========================================================
     RESULTADO SAP
     ========================================================= */

  const [result, setResult] = useState(null);


  /* =========================================================
     ESTADOS DE ENVÍO
     ========================================================= */

  const [isCreatingProduct, setIsCreatingProduct] =
    useState(false);

  const [isCreatingCustomer, setIsCreatingCustomer] =
    useState(false);


  /* =========================================================
     NAVEGACIÓN DEL ADMIN
     ========================================================= */

  function handleNavigate(section) {
    setActiveSection(section);
    setResult(null);
  }


  /* =========================================================
     CAMBIO DE CAMPOS
     ========================================================= */

  function handleFormChange(setForm) {
    return (event) => {
      const {
        checked,
        name,
        type,
        value,
      } = event.target;

      setForm((currentForm) => ({
        ...currentForm,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      }));

      setResult(null);
    };
  }


  /* =========================================================
     REGISTRO DE ACTIVIDAD CONFIRMADA
     ========================================================= */

  function addRegisteredRecord(type, form) {
    const nextRecord = {
      id: form.id.trim(),
      key: `${type}-${form.id.trim()}-${Date.now()}`,
      name: form.name.trim(),
      time: getRecordTime(),
      type,
    };

    setRecords((currentRecords) =>
      [
        nextRecord,
        ...currentRecords,
      ].slice(0, 5),
    );
  }


  /* =========================================================
     CREAR PRODUCTO REAL
     ========================================================= */

  async function handleProductSubmit(event) {
    event.preventDefault();

    if (isCreatingProduct) {
      return;
    }

    const productPayload = {
      id: productForm.id.trim(),
      name: productForm.name.trim(),
      category: productForm.category,
      description: productForm.description.trim(),
      currency: productForm.currency,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      reservedStock: Number(
        productForm.reservedStock || 0,
      ),
      active: productForm.active,
    };

    console.log(
      "Producto enviado desde Admin:",
      productPayload,
    );

    setIsCreatingProduct(true);
    setResult(null);

    try {
      const sapResult =
        await createProduct(productPayload);

      console.log(
        "Respuesta SAP producto:",
        sapResult,
      );

      /*
       * Solo llegamos aquí si techstore-api respondió
       * correctamente.
       */
      addRegisteredRecord(
        "product",
        productForm,
      );

      setResult({
        type: "product",
        status: "success",
        message:
          sapResult?.MESSAGE ||
          `Producto ${productPayload.id} creado correctamente.`,
      });

      /*
       * Volvemos a consultar productos reales.
       * Esto actualiza ProductsView y AdminOverview
       * sin recargar el navegador.
       */
      try {
        await refreshProducts();
      } catch (refreshError) {
        console.error(
          "Producto creado, pero no se pudo refrescar el catálogo:",
          refreshError,
        );
      }
    } catch (error) {
      console.error(
        "Error creando producto:",
        error,
      );

      setResult({
        type: "product",
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible registrar el producto.",
      });
    } finally {
      setIsCreatingProduct(false);
    }
  }


  /* =========================================================
     CREAR CLIENTE REAL
     ========================================================= */

  async function handleCustomerSubmit(event) {
    event.preventDefault();

    if (isCreatingCustomer) {
      return;
    }

    const customerPayload = {
      id: customerForm.id.trim(),
      name: customerForm.name.trim(),
      documentType: customerForm.documentType,
      documentNumber:
        customerForm.documentNumber.trim(),
      email: customerForm.email.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      active: customerForm.active,
    };

    console.log(
      "Cliente enviado desde Admin:",
      customerPayload,
    );

    setIsCreatingCustomer(true);
    setResult(null);

    try {
      const sapResult =
        await createCustomer(customerPayload);

      console.log(
        "Respuesta SAP cliente:",
        sapResult,
      );

      addRegisteredRecord(
        "customer",
        customerForm,
      );

      setResult({
        type: "customer",
        status: "success",
        message:
          sapResult?.MESSAGE ||
          `Cliente ${customerPayload.id} creado correctamente.`,
      });

      /*
       * Volvemos a consultar clientes reales.
       */
      try {
        await refreshCustomers();
      } catch (refreshError) {
        console.error(
          "Cliente creado, pero no se pudo refrescar la lista:",
          refreshError,
        );
      }
    } catch (error) {
      console.error(
        "Error creando cliente:",
        error,
      );

      setResult({
        type: "customer",
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible registrar el cliente.",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  }


  /* =========================================================
     RESTABLECER PRODUCTO
     ========================================================= */

  function resetProductForm() {
    setProductForm(initialProductForm);
    setResult(null);
  }


  /* =========================================================
     RESTABLECER CLIENTE
     ========================================================= */

  function resetCustomerForm() {
    setCustomerForm(initialCustomerForm);
    setResult(null);
  }


  /* =========================================================
     UI
     ========================================================= */

  return (
    <section className="admin-page">

      {/* Fondo decorativo */}
      <div
        className="admin-background"
        aria-hidden="true"
      >
        <div className="admin-grid-pattern" />
        <div className="admin-orb admin-orb-one" />
        <div className="admin-orb admin-orb-two" />
      </div>


      {/* =====================================================
          CABECERA
          ===================================================== */}

      <motion.header
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="admin-hero"
        initial={
          prefersReducedMotion
            ? false
            : {
                opacity: 0,
                y: 18,
              }
        }
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="admin-hero-copy">
          <span className="admin-hero-badge">
            <AdminIcon
              name="shield"
              size={16}
            />

            ADMINISTRACIÓN TECHSTORE
          </span>

          <h1>
            Centro de{" "}
            <span>administración</span>
          </h1>

          <p>
            Gestiona productos y clientes
            desde TechStore con integración
            directa hacia SAP.
          </p>
        </div>


        {/* Estado real de integración */}

        <div className="admin-demo-status">
          <span className="admin-demo-status-icon">
            <AdminIcon
              name="database"
              size={21}
            />
          </span>

          <div>
            <span>INTEGRACIÓN ACTIVA</span>

            <strong>
              Conectado con SAP
            </strong>

            <small>
              Los registros se publican
              mediante Integration Suite.
            </small>
          </div>

          <span
            className="admin-demo-pulse"
            aria-hidden="true"
          />
        </div>
      </motion.header>


      {/* =====================================================
          FLUJO DE INTEGRACIÓN
          ===================================================== */}

      <div
        className="admin-flow-strip"
        aria-label="Flujo de publicación"
      >
        <span>
          <AdminIcon
            name="layers"
            size={17}
          />

          Panel Admin
        </span>

        <i>→</i>

        <span>
          <AdminIcon
            name="database"
            size={17}
          />

          TechStore API
        </span>

        <i>→</i>

        <span>
          <AdminIcon
            name="check"
            size={17}
          />

          SAP
        </span>

        <small>
          Integración activa mediante SAP
          Integration Suite
        </small>
      </div>


      {/* =====================================================
          WORKSPACE
          ===================================================== */}

      <motion.div
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="admin-workspace"
        initial={
          prefersReducedMotion
            ? false
            : {
                opacity: 0,
                y: 24,
              }
        }
        transition={{
          delay: 0.12,
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >

        {/* Sidebar */}

        <AdminSidebar
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />


        {/* Contenido */}

        <main className="admin-content">
          <AnimatePresence mode="wait">
            <div key={activeSection}>

              {/* ==============================
                  RESUMEN
                  ============================== */}

              {activeSection === "overview" && (
                <AdminOverview
                  customerCount={
                    activeCustomers.length
                  }
                  onNavigate={handleNavigate}
                  productCount={
                    activeProducts.length
                  }
                  records={records}
                />
              )}


              {/* ==============================
                  PRODUCTO
                  ============================== */}

              {activeSection === "product" && (
                <ProductAdminForm
                  form={productForm}
                  isSubmitting={
                    isCreatingProduct
                  }
                  onChange={handleFormChange(
                    setProductForm,
                  )}
                  onReset={resetProductForm}
                  onSubmit={handleProductSubmit}
                  result={result}
                />
              )}


              {/* ==============================
                  CLIENTE
                  ============================== */}

              {activeSection === "customer" && (
                <CustomerAdminForm
                  form={customerForm}
                  isSubmitting={
                    isCreatingCustomer
                  }
                  onChange={handleFormChange(
                    setCustomerForm,
                  )}
                  onReset={resetCustomerForm}
                  onSubmit={handleCustomerSubmit}
                  result={result}
                />
              )}

            </div>
          </AnimatePresence>
        </main>
      </motion.div>
    </section>
  );
}


export default AdminView;