import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const AdminProfile = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-muted-foreground">Você precisa estar logado para acessar este conteúdo.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-lg mx-auto bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Perfil do Administrador</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>

        <div className="mt-4">
          <Button onClick={() => signOut()}>Sair</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
