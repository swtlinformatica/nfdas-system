// utils/certificateValidator.js
const forge = require('node-forge');
const fs = require('fs');

async function validateCertificate(filePath, password) {
  try {
    // Ler arquivo do certificado
    const certificateBuffer = fs.readFileSync(filePath);

    // Converter para string binária
    const certificateBinary = certificateBuffer.toString('binary');

    // Decodificar PKCS#12
    const p12Asn1 = forge.asn1.fromDer(certificateBinary);
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    // Obter certificado
    const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag });
    if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
      return {
        valid: false,
        error: 'Certificado não encontrado no arquivo'
      };
    }

    const cert = certBags[forge.pki.oids.certBag][0].cert;

    // Obter chave privada
    const keyBags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    if (!keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
      return {
        valid: false,
        error: 'Chave privada não encontrada no arquivo'
      };
    }

    // Extrair informações do certificado
    const subject = cert.subject.attributes;
    const issuer = cert.issuer.attributes;
    const validFrom = new Date(cert.validity.notBefore);
    const validUntil = new Date(cert.validity.notAfter);

    // Verificar se certificado está válido
    const now = new Date();
    if (now < validFrom || now > validUntil) {
      return {
        valid: false,
        error: `Certificado expirado ou ainda não válido. Válido de ${validFrom.toLocaleDateString('pt-BR')} a ${validUntil.toLocaleDateString('pt-BR')}`
      };
    }

    // Extrair issuer
    let issuerName = '';
    issuer.forEach(attr => {
      if (attr.name === 'commonName') {
        issuerName = attr.value;
      }
    });

    return {
      valid: true,
      issuer: issuerName || 'Autoridade Certificadora',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      subject: subject,
      cert: cert
    };

  } catch (error) {
    console.error('Erro ao validar certificado:', error);
    
    if (error.message.includes('password')) {
      return {
        valid: false,
        error: 'Senha do certificado incorreta'
      };
    }

    return {
      valid: false,
      error: error.message || 'Erro ao validar certificado'
    };
  }
}

module.exports = {
  validateCertificate
};
