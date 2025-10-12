# Test complet de connexion agent avec cookies
Write-Host "=== TEST COMPLET CONNEXION AGENT ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Connexion via agent-login
Write-Host "1. Connexion via agent-login..." -ForegroundColor Yellow

$body = @{
    email = "agent.test@esignpro.ch"
    password = "test123"
} | ConvertTo-Json

try {
    # Créer une session web pour conserver les cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/agent-login" -Method POST -Body $body -ContentType "application/json" -WebSession $session
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "✅ Connexion agent-login reussie !" -ForegroundColor Green
        Write-Host "   - User ID: $($data.user.id)" -ForegroundColor White
        Write-Host "   - Email: $($data.user.email)" -ForegroundColor White
        Write-Host "   - Role: $($data.user.role)" -ForegroundColor White
        Write-Host "   - Agent Code: $($data.user.agent.agent_code)" -ForegroundColor White
        
        # Vérifier les cookies
        Write-Host ""
        Write-Host "2. Verification des cookies..." -ForegroundColor Yellow
        
        $cookies = $session.Cookies.GetCookies("http://localhost:3000")
        $agentTokenFound = $false
        
        foreach ($cookie in $cookies) {
            Write-Host "   - Cookie: $($cookie.Name) = $($cookie.Value.Substring(0, [Math]::Min(20, $cookie.Value.Length)))..." -ForegroundColor White
            if ($cookie.Name -eq "agent_token") {
                $agentTokenFound = $true
                Write-Host "   ✅ agent_token trouve !" -ForegroundColor Green
            }
        }
        
        if (-not $agentTokenFound) {
            Write-Host "   ❌ agent_token NON trouve !" -ForegroundColor Red
        }
        
        # Étape 3: Test d'accès à /agent avec les cookies
        Write-Host ""
        Write-Host "3. Test acces a /agent avec cookies..." -ForegroundColor Yellow
        
        try {
            $agentResponse = Invoke-WebRequest -Uri "http://localhost:3000/agent" -WebSession $session
            
            if ($agentResponse.StatusCode -eq 200) {
                # Vérifier si c'est la vraie page agent ou une redirection vers login
                if ($agentResponse.Content -like "*Se connecter*" -or $agentResponse.Content -like "*login*") {
                    Write-Host "   ❌ Redirection vers login detectee" -ForegroundColor Red
                    Write-Host "   → Le middleware bloque encore l'acces" -ForegroundColor Red
                } else {
                    Write-Host "   ✅ Acces a /agent reussi !" -ForegroundColor Green
                    Write-Host "   → Page agent chargee correctement" -ForegroundColor Green
                }
            }
        } catch {
            Write-Host "   ❌ Erreur acces /agent: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Connexion agent-login echouee:" -ForegroundColor Red
        Write-Host "   $($data.message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur lors du test:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIN DU TEST ===" -ForegroundColor Cyan
