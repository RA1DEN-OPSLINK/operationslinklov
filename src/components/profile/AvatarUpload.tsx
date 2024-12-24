import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UseFormSetValue } from "react-hook-form";

interface AvatarUploadProps {
  profileId: string;
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  setValue: UseFormSetValue<any>;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ 
  profileId, 
  avatarUrl, 
  firstName, 
  lastName, 
  setValue, 
  onUploadComplete 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const { error: bucketError } = await supabase
        .storage
        .createBucket('avatars', { public: true });
      
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        throw bucketError;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setValue('avatar_url', publicUrl.publicUrl);
      onUploadComplete(publicUrl.publicUrl);

      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
      });
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      <div>
        <Input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={isUploading}
          className="max-w-xs"
        />
        {isUploading && (
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>
    </div>
  );
}