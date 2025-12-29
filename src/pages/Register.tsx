import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";

const Register = () => {
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signUpWithEmail(email, password);
    if (res?.error) {
      toast.error(res.error.message || "Erro ao cadastrar");
    } else {
      toast.success("Cadastro efetuado. Verifique seu email para confirmação.");
      navigate("/");
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Cadastrar</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Criar conta</Button>
        </form>
      </div>
    </div>
  );
};

export default Register;
