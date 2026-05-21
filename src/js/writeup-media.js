function replaceMissingImage(image) {
  const figure = image.closest("figure");
  if (figure) {
    figure.remove();
    return;
  }

  image.remove();
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
