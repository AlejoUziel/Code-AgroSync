import { createResource, isResourceKey, listResource } from "@/lib/resource-store";
import { accessErrorResponse, assertSameOrigin } from "@/lib/authorization";

export async function GET(_request: Request, context: RouteContext<"/api/resources/[resource]">) {
  const { resource } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    return Response.json(await listResource(resource));
  } catch (error) {
    return accessErrorResponse(error, "No se pudo cargar el recurso.", 500);
  }
}

export async function POST(request: Request, context: RouteContext<"/api/resources/[resource]">) {
  const { resource } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    assertSameOrigin(request);
    const body = await request.json();
    return Response.json(await createResource(resource, body), { status: 201 });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo guardar.", 500);
  }
}
