// Módulo de generación de PDF para PWA Matriz de Vectores
// Requiere html2pdf.js y marked.js importados en tu proyecto

/**
 * Convierte el Markdown retornado por el LLM en un PDF profesional con diseño oscuro/futurista.
 * @param {string} markdownText - Respuesta en Markdown generada por el cerebro (LLM)
 * @param {string} filename - Nombre opcional para el archivo descargado
 */
export async function generarPDFDesdeMarkdown(markdownText, filename = null) {
  if (typeof window.marked === 'undefined') {
    console.error('La librería marked.js no está cargada en window.');
    alert('Error: marked.js no cargado');
    return;
  }
  if (typeof window.html2pdf === 'undefined') {
    console.error('La librería html2pdf.js no está cargada en window.');
    alert('Error: html2pdf no cargado');
    return;
  }

  console.log("Generando PDF desde Markdown:", markdownText);
  // 1. Convertir Markdown a HTML
  const rawHtml = window.marked.parse(markdownText || 'No hay contenido para mostrar');

  // 2. Crear contenedor con estilos sencillos
  const container = document.createElement('div');
  container.className = 'pdf-export-container';
  // En lugar de ocultarlo con left:-9999 (que rompe canvas), lo ponemos atrás y lo hacemos opaco para el canvas
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px'; 
  container.style.zIndex = '-9999'; // Queda detrás de la app visible
  
  container.innerHTML = `
    <style>
      .pdf-export-container {
        padding: 40px;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #ffffff;
        color: #000000;
        font-size: 14px;
        line-height: 1.6;
      }
      .pdf-export-container h1, .pdf-export-container h2, .pdf-export-container h3, .pdf-export-container h4, .pdf-export-container h5, .pdf-export-container u {
        color: #000000;
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: bold;
      }
      .pdf-export-container h1 { font-size: 22px; border-bottom: 2px solid #000; padding-bottom: 5px; }
      .pdf-export-container h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
      .pdf-export-container p { margin-bottom: 15px; color: #000000; }
      .pdf-export-container strong { font-weight: bold; color: #000000; }
      .pdf-export-container ul { list-style-type: disc; padding-left: 20px; margin-bottom: 15px; }
      .pdf-export-container li { margin-bottom: 5px; color: #000000; }
    </style>
    <div>
      ${rawHtml}
    </div>
  `;

  document.body.appendChild(container);

  const pdfName = filename || `Proyeccion_Futuro_${Date.now()}.pdf`;

  // 3. Opciones de exportación PDF
  const opt = {
    margin: 15,
    filename: pdfName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, windowWidth: 800, scrollY: 0, scrollX: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // 4. Generar y descargar
  try {
    await window.html2pdf().set(opt).from(container).save();
    console.log("PDF generado con éxito:", pdfName);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
  } finally {
    // Remover el contenedor después de generar el PDF
    document.body.removeChild(container);
  }
}
