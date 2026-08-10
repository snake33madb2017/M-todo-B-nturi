const PDFDocument = require("pdfkit");
const fs = require('fs');

const doc = new PDFDocument({ margin: 50, size: 'A4', compress: false });
const outPath = 'C:/Users/Snake/.gemini/antigravity-ide/brain/50c69585-b45c-43f6-a8bc-da8fb7c4efe1/Informe_Cuantico_Demo.pdf';
doc.pipe(fs.createWriteStream(outPath));

// Fondo oscuro
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0B101E');

// Cabecera
doc.fillColor('#00E5FF').fontSize(22).font('Helvetica-Bold').text('INFORME CUÁNTICO BÉNTURI', { align: 'center' });
doc.moveDown(1);
doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Oblique').text(`Consulta: "Conseguire mi trabajo EL PROXIMO MARTES ?"`, { align: 'center' });
doc.moveDown(2);

const text = "ANÁLISIS INDIVIDUAL DE LOS VECTORES, VECTORES DE PROYECCIÓN O CARTAS 📊✨\n\n" +
       "• Vector 1: Observamos una energía inicial que resuena con el estado de 'El Deseo' en la pirámide de crecimiento personal. Existe una fuerte expectativa sobre el resultado de tu consulta.\n\n" +
       "• Vector 2: Hay una transición hacia el 'Valor' y 'Aprendizaje'. Los vectores de proyección muestran que las acciones tomadas están rompiendo antiguas creencias limitantes.\n\n" +
       "• Vector 3: La proyección final apunta hacia el 'Desapego'. El algoritmo detecta que la materialización depende de soltar el miedo al resultado.\n\n" +
       "CORRELACIÓN DINÁMICA DE LOS VECTORES, VECTORES DE PROYECCIÓN O CARTAS 🔗🔄\n\n" +
       "El entrelazamiento de estos tres vectores crea una frecuencia de alta vibración. Al igual que en la física cuántica el observador altera lo observado, tu percepción actual está modificando este escenario. La fricción inicial se está diluyendo gracias a la acción tomada.\n\n" +
       "RESULTADO GLOBAL: PROYECCIÓN DE ALTÍSIMA PROBABILIDAD 🌌🔮\n\n" +
       "La probabilidad de que tu consulta ('Conseguire mi trabajo EL PROXIMO MARTES ?') colapse en un escenario favorable es excepcionalmente fluida. Existen factores externos y cambios de energía externa que condicionarán el resultado final, pero todo indica que las frecuencias están sintonizadas.\n" +
       "Deberás aplicar el Método Bénturi: Conoce esta probabilidad, vibra en la frecuencia del Amor incondicional y, sobre todo, Decide tomar acción mediante el Scripting y el desapego total al resultado.\n\n" +
       "SI EL ALGORITMO HA AJUSTADO ESA PROYECCION DE FUTURO DE ALTISIMA PROBABILIDAD, QUE ALGUNOS LLAMARÁN DESTINO.\n" +
       "Desbloquea el método Bénturi completo ,por mucho menos de lo que cuesta un menú  al mes y tendrás acceso a infinitas proyecciones de futuro, y a una de 24 cartas al mes ,\n" +
       "Así como a la evaluación de tu estado en la pirámide del amor\n" +
       "Y la generación de visualizaciones con imágenes.\n" +
       "Para que ya no seas un mero espectador de ese destino.\n" +
       "Y pasarás a ser un arquitecto de él \n" +
       "Como ya lo hacen muchas personas , que no son mejores que tú, y les va muy bien en la vida.\n" +
       "¡Suerte!\n" +
       "Probablemente, ya no la necesites";

doc.fillColor('#E0E0E0').fontSize(11).font('Helvetica').text(text, { align: 'left', lineGap: 5 });

doc.end();
console.log("PDF generated at: " + outPath);
