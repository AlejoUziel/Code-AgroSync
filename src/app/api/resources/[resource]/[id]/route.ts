import { deleteResource, isResourceKey, updateResource } from "@/lib/resource-store";
import { accessErrorResponse, assertSameOrigin } from "@/lib/authorization";

export async function PUT(request: Request, context: RouteContext<"/api/resources/[resource]/[id]">) {
  const { resource, id } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    assertSameOrigin(request);
    const body = await request.json();
    return Response.json(await updateResource(resource, id, body));
  } catch (error) {
    return accessErrorResponse(error, "No se pudo actualizar.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext<"/api/resources/[resource]/[id]">) {
  const { resource, id } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    assertSameOrigin(request);
    await deleteResource(resource, id);
    return Response.json({ ok: true });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo eliminar.", 500);
  }
}
