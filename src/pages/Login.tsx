import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailSign = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signInWithEmail(email, password);
    if (res?.error) {
      toast.error(res.error.message || "Erro ao entrar");
    } else {
      toast.success("Entrou com sucesso");
      navigate("/");
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Entrar</h2>
        <Button className="mb-4" onClick={() => signInWithGoogle()}>
          Entrar com Google
        </Button>

        <form onSubmit={handleEmailSign} className="flex flex-col gap-2">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Entrar</Button>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          Não tem conta? <Link to="/register" className="text-primary">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
