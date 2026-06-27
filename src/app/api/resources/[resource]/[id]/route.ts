import { deleteResource, isResourceKey, updateResource } from "@/lib/resource-store";

export async function PUT(request: Request, context: RouteContext<"/api/resources/[resource]/[id]">) {
  const { resource, id } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    const body = await request.json();
    return Response.json(await updateResource(resource, id, body));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/resources/[resource]/[id]">) {
  const { resource, id } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    await deleteResource(resource, id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "No se pudo eliminar." },
      { status: 400 }
    );
  }
}
