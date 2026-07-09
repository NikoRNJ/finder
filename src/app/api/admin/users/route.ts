import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/adminGuard";
import { usernameToEmail } from "@/lib/constants";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { username, password, displayName } = await request.json();

  if (!USERNAME_RE.test(username ?? "")) {
    return NextResponse.json(
      { error: "Usuario inválido: 3-20 caracteres, minúsculas, números y _" },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: {
      username: username.toLowerCase(),
      display_name: displayName || username,
    },
  });

  if (error) {
    const msg = error.message.includes("already")
      ? "Ese nombre de usuario ya existe"
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ id: data.user.id, username }, { status: 201 });
}
