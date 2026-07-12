import { createResource, isResourceKey, listResource } from "@/lib/resource-store";

export async function GET(_request: Request, context: RouteContext<"/api/resources/[resource]">) {
  const { resource } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    return Response.json(await listResource(resource));
  } catch {
    return Response.json({ message: "No se pudo cargar el recurso." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext<"/api/resources/[resource]">) {
  const { resource } = await context.params;
  if (!isResourceKey(resource)) {
    return Response.json({ message: "Recurso no valido." }, { status: 404 });
  }
  try {
    const body = await request.json();
    return Response.json(await createResource(resource, body), { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "No se pudo guardar." },
      { status: 400 }
    );
  }
}
