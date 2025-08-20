import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/catalyst/button';
import { Input, InputGroup } from '@/components/catalyst/input';
import { Field, Label, ErrorMessage } from '@/components/catalyst/fieldset';
import { AuthLayout } from '@/components/catalyst/auth-layout';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { Divider } from '@/components/catalyst/divider';
import { Link } from '@/components/catalyst/link';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      // Handle password mismatch
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (!error) {
      // Success - user will get email verification
    }

    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white text-lg font-medium mx-auto mb-6 dark:bg-white dark:text-zinc-900">
            C
          </div>
          <Heading level={1}>Create account</Heading>
          <Text className="mt-2">Join cann.contact to manage your business data</Text>
        </div>

        <Divider className="my-8" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <Label>Full Name</Label>
            <InputGroup>
              <User data-slot="icon" />
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          <Field>
            <Label>Email</Label>
            <InputGroup>
              <Mail data-slot="icon" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          <Field>
            <Label>Password</Label>
            <InputGroup>
              <Lock data-slot="icon" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </InputGroup>
          </Field>

          <Field>
            <Label>Confirm Password</Label>
            <InputGroup>
              <Lock data-slot="icon" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </InputGroup>
            {password !== confirmPassword && confirmPassword && (
              <ErrorMessage>Passwords do not match</ErrorMessage>
            )}
          </Field>

          <Button 
            type="submit" 
            disabled={isLoading || password !== confirmPassword} 
            className="w-full"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <Text className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium">
            Sign in
          </Link>
        </Text>
      </div>
    </AuthLayout>
  );
}