export async function onRequest(context) {
  const objects = await context.env.PHOTOS.list();
  const keys = objects.objects.map(obj => obj.key);
  return Response.json(keys);
}
