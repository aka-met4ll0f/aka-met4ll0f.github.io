const pageLang = document.documentElement.lang === "en" ? "en" : "es";

const missingImageText =
  pageLang === "en"
    ? "Image pending: evidence is not available in the published repository yet."
    : "Imagen pendiente: la evidencia aún no está disponible en el repositorio publicado.";

function replaceMissingImage(image) {
  const figure = image.closest("figure");
  const fallback = document.createElement("p");
  fallback.className = "writeup-image-fallback";
  fallback.textContent = missingImageText;

  image.remove();

  if (figure) {
    figure.prepend(fallback);
  }
}

document.querySelectorAll("img.writeup-image").forEach((image) => {
  image.loading = "lazy";
  image.decoding = "async";

  if (image.complete && image.naturalWidth === 0) {
    replaceMissingImage(image);
    return;
  }

  image.addEventListener(
    "error",
    () => replaceMissingImage(image),
    { once: true }
  );
});
