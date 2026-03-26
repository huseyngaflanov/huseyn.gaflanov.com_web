export async function onRequest(context) {
  const objects = await context.env.PHOTOS.list({ prefix: 'originals/' });
  const keys = objects.objects.map(obj => obj.key.replace('originals/', ''));
  return Response.json(keys);
}
